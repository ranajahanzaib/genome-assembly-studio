import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database"] == "connected"
    assert data["engine"] == "ready"

def test_tools_check(client):
    response = client.get("/api/v1/tools")
    assert response.status_code == 200
    tools = response.json()
    assert len(tools) >= 5
    gs = next(t for t in tools if t["tool"] == "genome-studio")
    assert gs["available"] is True

def test_demo_project_seeded(client):
    resp = client.get("/api/v1/projects")
    assert resp.status_code == 200
    projects = resp.json()
    assert any("Escherichia coli" in p["name"] for p in projects)

def test_assemblies_and_metrics(client):
    resp = client.get("/api/v1/assemblies")
    assert resp.status_code == 200
    assemblies = resp.json()
    assert len(assemblies) >= 2

    # Check metrics on one of the assemblies
    asm = next(a for a in assemblies if a["metrics"] is not None)
    aid = asm["id"]
    m_resp = client.get(f"/api/v1/assemblies/{aid}/metrics")
    assert m_resp.status_code == 200
    data = m_resp.json()
    assert "stats" in data
    assert data["stats"]["n50"] > 0
    assert data["stats"]["total_length"] > 0

def test_genome_wheel_endpoint(client):
    resp = client.get("/api/v1/assemblies")
    asm = next(a for a in resp.json() if a["metrics"] is not None)
    wheel_resp = client.get(f"/api/v1/assemblies/{asm['id']}/genome-wheel")
    assert wheel_resp.status_code == 200
    data = wheel_resp.json()
    assert "chromosomes" in data
    assert len(data["chromosomes"]) > 0

def test_graph_endpoint(client):
    resp = client.get("/api/v1/assemblies")
    aid = resp.json()[0]["id"]
    g_resp = client.get(f"/api/v1/assemblies/{aid}/graph")
    assert g_resp.status_code == 200
    graph = g_resp.json()
    assert graph["total_nodes"] > 0
    assert graph["total_edges"] > 0

def test_comparisons_and_findings(client):
    p_resp = client.get("/api/v1/projects")
    pid = p_resp.json()[0]["id"]

    c_resp = client.get(f"/api/v1/comparisons/project/{pid}")
    assert c_resp.status_code == 200
    comps = c_resp.json()
    assert len(comps) > 0

    comp = comps[0]
    assert len(comp["deltas"]) > 0
    assert len(comp["findings"]) > 0
    assert any(f["category"] == "improvement" for f in comp["findings"])

def test_projects_crud(client):
    # 1. Create
    resp = client.post("/api/v1/projects", json={
        "name": "Test Assembly Project",
        "description": "Testing CRUD operations",
        "organism": "Saccharomyces cerevisiae",
        "taxonomy_id": "4932",
        "tags": ["test", "yeast"]
    })
    assert resp.status_code == 201
    p = resp.json()
    pid = p["id"]
    assert p["name"] == "Test Assembly Project"

    # 2. Get
    resp = client.get(f"/api/v1/projects/{pid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == pid

    # 3. Update
    resp = client.put(f"/api/v1/projects/{pid}", json={
        "name": "Updated Test Project"
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Test Project"

    # 4. Delete
    resp = client.delete(f"/api/v1/projects/{pid}")
    assert resp.status_code == 204

def test_reports_and_bed_export(client):
    # Fetch assemblies
    resp = client.get("/api/v1/assemblies")
    assert resp.status_code == 200
    assemblies = resp.json()
    assert len(assemblies) >= 2
    asm1 = assemblies[0]["id"]
    asm2 = assemblies[1]["id"]

    # 1. Assembly Report in Markdown
    resp = client.get(f"/api/v1/assemblies/{asm1}/report?format=markdown")
    assert resp.status_code == 200
    assert "# Genome Assembly Assessment Report" in resp.text

    # 2. Assembly Report in TSV
    resp = client.get(f"/api/v1/assemblies/{asm1}/report?format=tsv")
    assert resp.status_code == 200
    assert "metric\tvalue" in resp.text

    # 3. Gaps BED Export
    resp = client.get(f"/api/v1/assemblies/{asm1}/export/gaps.bed")
    assert resp.status_code == 200
    assert "#chrom\tchromStart" in resp.text

    # 4. Comparison Report in Markdown
    resp = client.get(f"/api/v1/comparisons/report/export?baseline_id={asm1}&compared_id={asm2}&format=markdown")
    assert resp.status_code == 200
    assert "# Comparative Assembly Report" in resp.text

    # 5. Comparison Report in TSV
    resp = client.get(f"/api/v1/comparisons/report/export?baseline_id={asm1}&compared_id={asm2}&format=tsv")
    assert resp.status_code == 200
    assert "absolute_delta" in resp.text

