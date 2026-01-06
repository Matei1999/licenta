# Sleep Apnea Management System

Sistema de management pentru pacienți cu apnee obstructivă în somn (OSA/SAOS).

## Features

✅ Gestionare pacienți cu date personale și medicale  
✅ Înregistrare vizite și teste de somnologie  
✅ Rapoarte complete și individuale cu paginare  
✅ Validare inteligentă de CNP cu auto-fill  
✅ Interfață de doctor cu statistici și filtrare  

## Quick Start

### Opțiunea 1: Cu Docker (Recomandat)

Cea mai simplă cale - doar o comandă:

```bash
docker-compose up
```

Apoi deschide: http://localhost:5000

👉 **Vezi [DOCKER.md](DOCKER.md) pentru detalii complete**

### Opțiunea 2: Development Local

```bash
# Instalează dependințe
npm install
cd frontend && npm install && cd ..

# Pornește backend
npm start

# În alt terminal, pornește frontend
npm run client
```

## Tech Stack

**Backend**: Node.js + Express + Sequelize + PostgreSQL  
**Frontend**: React 18 + Tailwind CSS  
**Database**: PostgreSQL cu JSONB support  
**Containerization**: Docker + Docker Compose

## Structură Proiect

```
├── backend/              # Express server + ORM models
├── frontend/             # React application
├── Dockerfile            # Container image build
├── docker-compose.yml    # Multi-container orchestration
├── DOCKER.md            # Docker documentation
└── package.json         # Root-level scripts
```

## Comanduri Utile

```bash
# Development cu auto-reload
npm run dev:full

# Seed database cu date de test
npm run seed:bulk

# Docker - start în background
docker-compose up -d

# Docker - view logs
docker-compose logs -f

# Docker - stop și reset
docker-compose down -v
```

## Default Credentials

**Email**: doctor@example.com  
**Password**: password123

⚠️ Schimbă-le după prima login!

## Database Schema

- **users** - Conturi de doctor
- **patients** - Informații pacienți (cu CNP encriptat)
- **visits** - Vizite medicale
- **polysomnographies** - Teste de somnologie cu metrici

## API Endpoints (Selecție)

```
GET  /api/patients              - Lista pacienți
GET  /api/patients/:id          - Detalii pacient
POST /api/patients              - Adaugă pacient
GET  /api/patients/reports/complete   - Raport complet (paginated)
GET  /api/patients/reports/individual - Raport individual (paginated)
```

👉 **API complet**: Deschide http://localhost:5000/api/swagger (dacă e configurat)

## Troubleshooting

### Port 5000 ocupat?

```bash
# Găsește procesul
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Sau folosește alt port în docker-compose.yml
```

### Database connection error?

```bash
docker-compose logs db
docker-compose restart db
```

### Reset complet?

```bash
docker-compose down -v
docker-compose up --build
```

## Documentație

- **[DOCKER.md](DOCKER.md)** - Detalii Docker setup
- **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)** - Design system și componente

## Pentru Doctori / Testers

1. Instalează [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Deschide terminal/PowerShell în folder proiect
3. Rulează: `docker-compose up`
4. Accesează: http://localhost:5000
5. Login cu credentialele default
6. Testează feature-urile!

## Support

Dacă ceva nu merge, verific logs:

```bash
docker-compose logs app    # Backend logs
docker-compose logs db     # Database logs
```

---

**Versiune**: 1.0.0 | **Status**: Production Ready ✅
