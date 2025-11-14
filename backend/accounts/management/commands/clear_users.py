from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Profile, LoginActivity


class Command(BaseCommand):
    help = 'Delete all user accounts and related data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        confirm = options.get('confirm', False)

        # Count before deletion
        user_count = User.objects.count()
        profile_count = Profile.objects.count()
        activity_count = LoginActivity.objects.count()

        if user_count == 0:
            self.stdout.write(self.style.WARNING('No users to delete.'))
            return

        self.stdout.write(
            self.style.WARNING(
                f'\n⚠️  WARNING: This will delete:\n'
                f'  - {user_count} user account(s)\n'
                f'  - {profile_count} profile(s)\n'
                f'  - {activity_count} login activity record(s)\n'
            )
        )

        if not confirm:
            response = input('\nType "DELETE ALL" to confirm: ').strip()
            if response != 'DELETE ALL':
                self.stdout.write(self.style.ERROR('Deletion cancelled.'))
                return

        # Delete login activities first (foreign key constraint)
        LoginActivity.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {activity_count} login activities'))

        # Delete profiles
        Profile.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {profile_count} profiles'))

        # Delete users
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {user_count} users'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ All user accounts and related data have been deleted successfully!'
            )
        )
