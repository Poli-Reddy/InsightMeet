"""
Async Job Manager for Whisper Transcription
Handles background processing with job queue
"""

import uuid
import time
import threading
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Job:
    id: str
    status: JobStatus
    progress: float  # 0.0 to 1.0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = 0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None

class JobManager:
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.lock = threading.Lock()
    
    def create_job(self) -> str:
        """Create a new job and return its ID"""
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            status=JobStatus.PENDING,
            progress=0.0,
            created_at=time.time()
        )
        
        with self.lock:
            self.jobs[job_id] = job
        
        return job_id
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status and result"""
        with self.lock:
            job = self.jobs.get(job_id)
            if job:
                return asdict(job)
        return None
    
    def update_job(self, job_id: str, **kwargs):
        """Update job fields"""
        with self.lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                for key, value in kwargs.items():
                    if hasattr(job, key):
                        setattr(job, key, value)
    
    def start_job(self, job_id: str):
        """Mark job as processing"""
        self.update_job(
            job_id,
            status=JobStatus.PROCESSING,
            started_at=time.time()
        )
    
    def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Mark job as completed with result"""
        self.update_job(
            job_id,
            status=JobStatus.COMPLETED,
            progress=1.0,
            result=result,
            completed_at=time.time()
        )
    
    def fail_job(self, job_id: str, error: str):
        """Mark job as failed with error"""
        self.update_job(
            job_id,
            status=JobStatus.FAILED,
            error=error,
            completed_at=time.time()
        )
    
    def update_progress(self, job_id: str, progress: float):
        """Update job progress (0.0 to 1.0)"""
        self.update_job(job_id, progress=min(1.0, max(0.0, progress)))
    
    def cleanup_old_jobs(self, max_age_seconds: int = 3600):
        """Remove jobs older than max_age_seconds"""
        current_time = time.time()
        with self.lock:
            to_remove = [
                job_id for job_id, job in self.jobs.items()
                if (job.completed_at or job.created_at) < current_time - max_age_seconds
            ]
            for job_id in to_remove:
                del self.jobs[job_id]

# Global job manager instance
job_manager = JobManager()
