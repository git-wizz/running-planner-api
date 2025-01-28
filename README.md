# Running Planner API

This project is a REST API for tracking runs, allowing users to store and manage details such as date, distance, pace, and notes.

## Features
- Full CRUD functionality for managing runs
- SQLite database for storing data
- API documentation generated using APIDoc
- Tests run using TestCafe

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/git-wizz/running-planner-api.git
   
2. Initialize the repository:
   ```bash
   git init
   
3. Assuming you do not already have NodeJS Installed, run this otherwise skip to (4):
   ```bash
   wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   
-- Close the terminal window and re-open the terminal
   
4. Install version 21 of NodeJS:
   ```bash
   nvm install 21
   
5. Initialize the repository to use the NPM package manager by running:
   ```bash
   npm init
   
-- This creates a **package.json** file in your repository used to list all the dependencies for the project.
   
6. Install APIDOC:
   ```bash
   npm install apidoc --save-dev

7. To run APIDOC:
   ```bash
   npm run apidoc
   
8. To run TestCafe:
   ```bash
   npm run test
   
9. Install TestCafe:
   ```bash
   npm install testcafe --save-dev

- _Given that this is only a small project, I am happy to provide support if you decide to clone this repository and try it out for yourself. I am open to feedback. Thanks in advance for trying it out :)_
