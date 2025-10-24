# BOUNSWE2025 Group 2  
![CMPE352 Group2 Banner](https://github.com/user-attachments/assets/b3aabda0-598b-476b-8fe1-940e3cce8162)


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

## Our individual profiles

  - [Ahmet Burak Çiçek](https://github.com/bounswe/bounswe2025group2/wiki/Ahmet-Burak-%C3%87i%C3%A7ek)
  - [Alperen Akyol](https://github.com/bounswe/bounswe2025group2/wiki/Alperen-Akyol)
  - [Ali Ayhan Günder](https://github.com/bounswe/bounswe2025group2/wiki/Ali-Ayhan-Gunder)
  - [Berkay Buğra Gök](https://github.com/bounswe/bounswe2025group2/wiki/Berkay-Bu%C4%9Fra-G%C3%B6k)
  - [Doran Pamukçu](https://github.com/bounswe/bounswe2025group2/wiki/Doran-%E2%80%90-Introduction)
  - [Güney Yüksel](https://github.com/bounswe/bounswe2025group2/wiki/G%C3%BCney-Y%C3%BCksel)
  - [Talha Başıbüyük](https://github.com/bounswe/bounswe2025group2/wiki/Talha-Ba%C5%9F%C4%B1b%C3%BCy%C3%BCk)
  - [Volkan Bora Seki](https://github.com/bounswe/bounswe2025group2/wiki/Volkan-Bora-Seki)
  - [Yusuf Akdoğan](https://github.com/bounswe/bounswe2025group2/wiki/Yusuf-Akdo%C4%9Fan-Self-Introduction)
  - [Abdullah Umut Hamzaoğulları](https://github.com/bounswe/bounswe2025group2/wiki/Abdullah-Umut-Hamzao%C4%9Fullar%C4%B1)

## Running the Software

Our deployed app can be found in this address: [http://164.90.166.81:3000/](http://164.90.166.81:3000/)

- Our web app can be set up to run locally with Docker by following these instructions.
  -  First, clone our project repository using `git clone https://github.com/bounswe/bounswe2025group2.git`
  -  Then, cd into the cloned repository `cd bounswe2025group2`
  -  Environment variables are not necessary for basic functionality since our configuration comes with default values if a variable is not provided. But you will need to copy the `.env.example` in the root directory of our repository and create a `.env` file with the variables inside it if you want full functionality.
       - For example you will need to enter a valid `GROQ_API_KEY` to be able to use the AI Tutor
       - Or the Nutrionix variables for the nutrition analyer (will be integrated later)
  -  With or without enviroment variables, our web app can be run with these. Note that we will have 3 containers (genfit_frontend, genfit_backend, genfit_db) running in a network for our app:
       - `docker-compose up --build -d` : Build the app and run the containers in the background
       - `docker-compose up --build` : Run in the terminal, useful for debugging the initalization
           - We use Django commands to execute Django shell commands when necessary. For example, in order to add the mock data, these containers use `python manage.py populate_db && python manage.py add_inclusive_forums` while building the app.
       - `docker-compose down -v` : Remove the container by deleting the volumes. Useful for resetting the content.
- We have a few other container configurations for a better developer experience. These are not necessary for local use of the app.
     - To run the Postgres to be able to work on the Django Backend, we use `backend/genfit_django/postgres-db.yml`
     - To run the Postgres + Django to be able to work on the React frontend, we use `backend/docker-compose.yml`
     - To deploy the app by pulling images, we use `docker-compose.prod.yml`
         - Our Github Actions workflow builds images [`.github/workflows/deploy.yml`] and pushes the containers to Dockerhub, and then uses this to pull and run the latest images on our server. We also have a build-check to ensure everyone makes sure their changes will be compiled and pushed correctly [`.github/workflows/pr-check.yml`] 

- Our mobile app can be run on the emulator by following the instructions [here](https://github.com/bounswe/bounswe2025group2/tree/main/mobile_frontend)

- Our mobile app can be run with the `.apk`
