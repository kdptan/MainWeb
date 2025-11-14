from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Profile


class Command(BaseCommand):
    help = 'Activate all inactive user accounts for testing'

    def handle(self, *args, **options):
        # Get all inactive users
        inactive_users = User.objects.filter(is_active=False)
        count = inactive_users.count()

        if count == 0:
            self.stdout.write(self.style.WARNING('No inactive users to activate.'))
            return

        # Activate all inactive users
        inactive_users.update(is_active=True)
        
        # Mark all profiles as email verified
        for user in inactive_users:
            profile = Profile.objects.filter(user=user).first()
            if profile:
                profile.email_verified = True
                profile.verification_token = None
                profile.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Activated {count} user account(s) for testing'
            )
        )
