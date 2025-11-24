# Debug Commands for Server

## Check if container is running
```bash
docker ps -a | grep genfit_backend
```

## If container is stopped, check full logs
```bash
docker logs genfit_backend 2>&1
```

## Start container in interactive mode (if stopped)
```bash
docker-compose -f docker-compose.prod.yml up backend
```

## Execute into the running container
```bash
docker exec -it genfit_backend bash
```

## Once inside the container, run the command manually
```bash
python manage.py prepare_presentation_data
```

## Check if the command file exists
```bash
docker exec -it genfit_backend ls -la /app/api/management/commands/
```

## Alternative: Run command from outside container
```bash
docker exec genfit_backend python manage.py prepare_presentation_data
```

## Check Django management commands available
```bash
docker exec genfit_backend python manage.py help
```

## Check if add_inclusive_forums exists
```bash
docker exec genfit_backend python manage.py add_inclusive_forums
```

