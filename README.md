# BOUNSWE2025 Group 2  
![CMPE352 Group2 Banner](https://github.com/user-attachments/assets/c3e1d7b3-dce5-4667-b2ea-b8f0dfca5b09)

Welcome to our project repository! We are **BOUNSWE2025 Group 2**, and we are working on developing a fitness-themed platform as a team.
Please visit our **[wiki page](https://github.com/bounswe/bounswe2025group2/wiki)** to reach the details of the project.

----

Our brief project description is:

> **Youth Sports & Fitness Hub**
>
> A platform connecting kids with local sports programs to keep them active and away from bad habits:
> - Find free and low-cost youth sports programs in the community
> - Track personal fitness goals and earn rewards
> - Connect with mentors and coaches for motivation
>  
> Key Features:
> - Interactive sports directory based on age and location
> - Virtual fitness challenges and leaderboards
> - Community forums for training tips, motivation, and success stories

----

### Our individual profiles

  - [Ahmet Burak Çiçek](https://github.com/bounswe/bounswe2025group2/wiki/Ahmet-Burak-%C3%87i%C3%A7ek)
  - [Ahmet Salih Turkel](https://github.com/bounswe/bounswe2025group2/wiki/Ahmet-Salih-Turkel-%E2%80%90-Introduction)
  - [Alperen Akyol](https://github.com/bounswe/bounswe2025group2/wiki/Alperen-Akyol)
  - [Ali Ayhan Günder](https://github.com/bounswe/bounswe2025group2/wiki/Ali-Ayhan-Gunder)
  - [Berkay Buğra Gök](https://github.com/bounswe/bounswe2025group2/wiki/Berkay-Bu%C4%9Fra-G%C3%B6k)
  - [Doran Pamukçu](https://github.com/bounswe/bounswe2025group2/wiki/Doran-%E2%80%90-Introduction)
  - [Ekin Menken](https://github.com/bounswe/bounswe2025group2/wiki/Ekin-Menken)
  - [Güney Yüksel](https://github.com/bounswe/bounswe2025group2/wiki/G%C3%BCney-Y%C3%BCksel)
  - [Talha Başıbüyük](https://github.com/bounswe/bounswe2025group2/wiki/Talha-Ba%C5%9F%C4%B1b%C3%BCy%C3%BCk)
  - [Volkan Bora Seki](https://github.com/bounswe/bounswe2025group2/wiki/Volkan-Bora-Seki)
  - [Yusuf Akdoğan](https://github.com/bounswe/bounswe2025group2/wiki/Yusuf-Akdo%C4%9Fan-Self-Introduction)

## Docker Compose Setup and Usage

### Prerequisites
1. Make sure you have Docker and Docker Compose installed on your system
2. Ensure you have Python virtual environment set up and activated:
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
source venv/bin/activate     # On Unix/macOS
```

### Database Configuration

Make sure your settings.py has the following database configuration:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'group2db'),
        'USER': os.environ.get('POSTGRES_USER', 'group2'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'group2'),
        'HOST': 'postgres', # This should match the service name in docker-compose.yml
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}
```

### Running with Docker Compose

1. Start all services (database, backend, and frontend):

```bash
docker-compose up
```

2. Start services in detached mode (background):
```bash
docker-compose up -d
```

3. Start all services with build:
```bash
docker-compose up --build
```

4. View logs of running containers:
```bash
docker-compose logs
```

5. Stop all services:
```bash
docker-compose down
```

6. Stop all services and remove volumes (this will delete all data):
```bash
docker-compose down -v
```

### Important Notes
- The database service (PostgreSQL) runs on port 5432
- The backend service runs on port 8000
- The frontend service runs on port 3000
- Database data is persisted in a Docker volume named postgres_data
- The backend service will automatically run migrations and populate initial data
