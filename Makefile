.PHONY: dev-frontend dev-backend install-frontend install-backend test

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && pip install -r requirements.txt --break-system-packages

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn main:app --reload --port 8000

test:
	cd backend && pytest tests/ -v

build:
	cd frontend && npm run build

docker-up:
	docker-compose up --build

lint:
	cd frontend && npm run lint
