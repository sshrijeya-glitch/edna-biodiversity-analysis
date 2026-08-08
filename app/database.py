from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# SQLite requires check_same_thread=False for multithreaded FastAPI requests
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session for each request.
    Closes session automatically after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
