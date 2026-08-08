from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import report_generator

router = APIRouter(prefix="/reports", tags=["Report Generation"])


@router.post("/{sample_id}/pdf")
def generate_and_download_pdf(sample_id: str, db: Session = Depends(get_db)):
    """
    Generate and download a styled PDF report (ReportLab) summarizing sample metadata,
    biodiversity indices, identified taxonomy, and unknown clusters.
    """
    try:
        pdf_path = report_generator.generate_pdf_report(db, sample_id)
        filename = f"sample_{sample_id[:8]}_report.pdf"
        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type="application/pdf",
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(err)}",
        )


@router.get("/{sample_id}/csv")
def download_csv_report(sample_id: str, db: Session = Depends(get_db)):
    """
    Export and download a CSV report containing sequence records and taxonomy assignments.
    """
    try:
        csv_path = report_generator.generate_csv_report(db, sample_id)
        filename = f"sample_{sample_id[:8]}_report.csv"
        return FileResponse(
            path=csv_path,
            filename=filename,
            media_type="text/csv",
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CSV report: {str(err)}",
        )
