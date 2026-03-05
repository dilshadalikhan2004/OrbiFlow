import time
from app.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization
from app.services.analytics_service import AnalyticsService

def test():
    db = SessionLocal()
    org = db.query(Organization).first()
    if not org:
        print("No org")
        return
    
    print("Testing analytics directly")
    start = time.time()
    try:
        data = AnalyticsService.get_dashboard(db, org.id)
        print("Took:", time.time() - start)
        print("Done")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    test()
