# Forum Creation Scripts

This directory contains scripts to create sample forums for the GenFit application.

## Available Scripts

### 1. Django Management Command (Recommended)
```bash
cd backend/genfit_django
python manage.py create_forums
```

**Options:**
- `--count N`: Create N forums (default: 3)
- `--force`: Force creation even if forums already exist

**Examples:**
```bash
# Create 3 forums (default)
python manage.py create_forums

# Create 5 forums
python manage.py create_forums --count 5

# Force create even if they exist
python manage.py create_forums --force
```

### 2. Wrapper Script (Easiest)
```bash
cd backend
python run_create_forums.py
```

### 3. Windows Batch File
```bash
cd backend
create_forums.bat
```

### 4. Standalone Scripts (Alternative)
```bash
cd backend
python create_forums_simple.py
```

```bash
cd backend
python create_random_forums.py
```

## What Gets Created

The scripts create forums with the following data:

1. **Fitness Tips & Advice**
   - Description: Share your fitness tips, workout routines, and get advice from the community.

2. **Nutrition & Diet**
   - Description: Discuss healthy eating habits, meal planning, supplements, and nutrition strategies.

3. **Workout Routines**
   - Description: Share and discover effective workout routines for different fitness goals.

## Requirements

- Django environment must be set up
- Database must be accessible
- UserWithType model must have at least one admin user (script will create one if none exists)

## Notes

- Scripts check for existing forums to avoid duplicates
- An admin user will be created automatically if none exists
- All forums are created as active by default
- Forums are ordered sequentially (1, 2, 3, etc.)

## Troubleshooting

If you encounter issues:

1. Make sure you're in the correct directory
2. Ensure Django is properly set up
3. Check that the database is accessible
4. Verify that the api app is properly installed

## Output

The scripts will show:
- ✅ Success messages for created forums
- ⚠️ Warning messages for existing forums
- 🎉 Final success message with count
