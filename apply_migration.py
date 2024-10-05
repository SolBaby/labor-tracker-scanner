from flask_migrate import upgrade
from app import create_app

def apply_migration():
    app = create_app()
    with app.app_context():
        upgrade()
    print("Migration completed successfully.")

if __name__ == "__main__":
    apply_migration()
