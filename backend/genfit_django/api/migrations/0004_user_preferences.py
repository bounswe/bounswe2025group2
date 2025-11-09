# Generated migration for user preferences

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_dailyadvice'),
    ]

    operations = [
        migrations.AddField(
            model_name='userwithtype',
            name='daily_advice_enabled',
            field=models.BooleanField(default=True, help_text='Enable AI-generated daily advice'),
        ),
    ]

