from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, LoginActivity


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False, default='user')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']
        role = validated_data.get('role', 'user')
        # create user using Django helper which hashes the password
        user = User.objects.create_user(username=username, email=email, password=password)
        # if role is admin, mark user as staff (admin privileges)
        if str(role).lower() == 'admin':
            user.is_staff = True
            # Do not automatically set is_superuser here for safety
            user.save()

        # persist role in Profile model so role is queryable later
        try:
            Profile.objects.create(user=user, role=role)
        except Exception:
            # If profile creation fails for any reason, ensure user still exists and log via serializer context
            pass

        return user


class ProfileSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # profile_picture is handled via request.FILES in the view; we don't accept it here as a regular field

    def validate_username(self, value):
        user = self.context.get('user')
        if User.objects.filter(username__iexact=value).exclude(pk=getattr(user, 'pk', None)).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate_email(self, value):
        user = self.context.get('user')
        if User.objects.filter(email__iexact=value).exclude(pk=getattr(user, 'pk', None)).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def validate(self, data):
        new = data.get('new_password')
        conf = data.get('confirm_password')
        if new or conf:
            if new != conf:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        new = validated_data.get('new_password')
        if new:
            instance.set_password(new)
        instance.save()
        return instance


class LoginActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = LoginActivity
        fields = ['id', 'username', 'role', 'login_time', 'is_active', 'user']
        read_only_fields = ['id', 'username', 'role', 'login_time', 'is_active']

    def get_role(self, obj):
        try:
            return obj.user.profile.role
        except:
            return 'user' if not obj.user.is_staff else 'admin'
