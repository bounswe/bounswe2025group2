# Generated manually for login tracking feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userwithtype',
            name='current_streak',
            field=models.IntegerField(default=0, help_text='Current consecutive days logged in'),
        ),
        migrations.AddField(
            model_name='userwithtype',
            name='longest_streak',
            field=models.IntegerField(default=0, help_text='Longest consecutive days logged in'),
        ),
        migrations.AddField(
            model_name='userwithtype',
            name='last_login_date',
            field=models.DateField(blank=True, help_text='Last date user logged in', null=True),
        ),
        migrations.AddField(
            model_name='userwithtype',
            name='total_login_days',
            field=models.IntegerField(default=0, help_text='Total number of unique days logged in'),
        ),
    ]

