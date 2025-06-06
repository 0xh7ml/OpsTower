## ToDo
---

### Frontend
- [x] Change UI Color default: #09090b
- [ ] Add Dark Theme + Light Theme
- [x] Check Responsiveness
- [x] Remove Save Project & Load Project
- [ ] Fix date button not working


### Backend
- [x] Api Endpoints for (TaskView, TaskDetails)
- [x] Authenticated with JWT mechanism & Protected Views
- [x] User wise object permission


## Installation

### Backend (Django API)

1. **Set up a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2. **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3. **Apply migrations**:
    ```bash
    python manage.py migrate
    ```

4. **Run the development server**:
    ```bash
    python manage.py runserver
    ```

### Frontend (Next.js)

1. **Install dependencies**:
    ```bash
    npm install
    ```

2. **Run the development server**:
    ```bash
    npm run dev
    ```

3. **Access the application**:
    Open your browser and navigate to `http://localhost:3000`