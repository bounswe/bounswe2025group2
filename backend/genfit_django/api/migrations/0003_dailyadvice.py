# Generated migration for DailyAdvice model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_add_login_tracking'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyAdvice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('advice_text', models.TextField(help_text='AI-generated daily advice')),
                ('date', models.DateField(help_text='Date this advice was generated for')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_advices', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date'],
                'indexes': [
                    models.Index(fields=['user', 'date'], name='api_dailyad_user_id_b8c5e3_idx'),
                ],
                'unique_together': {('user', 'date')},
            },
        ),
    ]

