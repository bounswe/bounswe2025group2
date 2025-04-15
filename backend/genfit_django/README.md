### Running the Django server
1. Make sure you have Python 3.10 or higher installed.

2. Create a virtual environment if you haven't already:
   ```bash
   python -m venv .venv
   ```
   
3. Activate the virtual environment:
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
     
4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

5. cd into the `genfit_django` directory:
   ```bash
   cd backend/genfit_django
   ```

6. Make migrations:
   ```bash
   python manage.py makemigrations
   ```
   
7. Migrate the database:
   ```bash
    python manage.py migrate
    ```
   
8. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

9. Run the server:
   ```bash
   python manage.py runserver
   ```
   

### Setting up the database

0. Make sure you have Docker installed and running.

1. Make sure you are in the `genfit_django` directory.

2. Make sure you have the `.env` file set up with the correct database settings. You can copy the `.env.example` file to `.env` and modify it as needed.

3. In order to build the database, use the postgres-db docker file
   ```bash
   docker-compose -f postgres-db.yml up -d
   ```

4. In order to stop the database, use the postgres-db docker file
   ```bash
   docker-compose -f postgres-db.yml down
   ```

**Note**: After configuring the database for the first time, you can run the following command to create the database and tables:
```bash
python manage.py makemigrations
```
```bash
python manage.py migrate
```
You should see the default tables created in the database.
   
**Note**: Database is supposed to persistent, so you can stop and start the database without losing data. However, running this command:
    ```bash
    docker-compose down -v
    ```
will remove the database volume and all data will be lost. Use this command with caution.



### Common Errors

- If the `settings.py` uses a custom Postgres database and the database is not running, you might see an error like this:
```
  django.db.utils.OperationalError: connection to server at "localhost" (::1), port 5432 failed: Connection refused
        Is the server running on that host and accepting TCP/IP connections?
connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
        Is the server running on that host and accepting TCP/IP connections?
```
This means that the database is not running as expected. Make sure to run the database using Docker as described above.

