from typing import List
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from services.api.app.core.database import get_db
from services.api.app.models.entities import Project, Assembly
from services.api.app.schemas.dto import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        count = db.query(Assembly).filter(Assembly.project_id == p.id).count()
        tags = json.loads(p.tags) if p.tags else []
        results.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            organism=p.organism,
            taxonomy_id=p.taxonomy_id,
            tags=tags,
            created_at=p.created_at,
            updated_at=p.updated_at,
            assembly_count=count
        ))
    return results

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=data.name,
        description=data.description,
        organism=data.organism,
        taxonomy_id=data.taxonomy_id,
        tags=json.dumps(data.tags),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        organism=project.organism,
        taxonomy_id=project.taxonomy_id,
        tags=data.tags,
        created_at=project.created_at,
        updated_at=project.updated_at,
        assembly_count=0
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    count = db.query(Assembly).filter(Assembly.project_id == project.id).count()
    tags = json.loads(project.tags) if project.tags else []
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        organism=project.organism,
        taxonomy_id=project.taxonomy_id,
        tags=tags,
        created_at=project.created_at,
        updated_at=project.updated_at,
        assembly_count=count
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.organism is not None:
        project.organism = data.organism
    if data.taxonomy_id is not None:
        project.taxonomy_id = data.taxonomy_id
    if data.tags is not None:
        project.tags = json.dumps(data.tags)

    db.commit()
    db.refresh(project)
    count = db.query(Assembly).filter(Assembly.project_id == project.id).count()
    tags = json.loads(project.tags) if project.tags else []
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        organism=project.organism,
        taxonomy_id=project.taxonomy_id,
        tags=tags,
        created_at=project.created_at,
        updated_at=project.updated_at,
        assembly_count=count
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None
