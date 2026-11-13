
"""
Django settings for RecruitPro project.
Production deployment: Render + PostgreSQL + Cloudflare Pages + R2
"""

from pathlib import Path
import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


# --------------------------------------------------
# BASE DIRECTORY AND ENVIRONMENT
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# SECURITY SETTINGS
# --------------------------------------------------

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

if not SECRET_KEY or SECRET_KEY == "generate-a-unique-secret-key":
    raise ImproperlyConfigured(
        "Set DJANGO_SECRET_KEY in environment variables."
    )

DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() in (
    "true", "1", "yes"
)

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1,recruitpro-api.onrender.com",
    ).split(",")
    if host.strip()
]


# --------------------------------------------------
# CORS CONFIGURATION - CLOUDFLARE + LOCALHOST
# --------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        "https://recruitpro-dashboard.samirdas4401.workers.dev,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

print("CORS DEBUG:", repr(CORS_ALLOWED_ORIGINS))


# --------------------------------------------------
# CSRF CONFIGURATION
# --------------------------------------------------

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "https://recruitpro-dashboard.samirdas4401.workers.dev",
    ).split(",")
    if origin.strip()
]


# --------------------------------------------------
# HTTPS / RENDER PROXY SETTINGS
# --------------------------------------------------

SECURE_SSL_REDIRECT = os.getenv(
    "DJANGO_SECURE_SSL_REDIRECT",
    str(not DEBUG),
).lower() in ("true", "1", "yes")

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_HSTS_SECONDS = int(
    os.getenv(
        "DJANGO_SECURE_HSTS_SECONDS",
        "0",
    )
)

SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS",
    "False",
).lower() in ("true", "1", "yes")

SECURE_HSTS_PRELOAD = os.getenv(
    "DJANGO_SECURE_HSTS_PRELOAD",
    "False",
).lower() in ("true", "1", "yes")

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


# --------------------------------------------------
# APPLICATIONS
# --------------------------------------------------

INSTALLED_APPS = [
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party apps
    "corsheaders",
    "rest_framework",

    # RecruitPro apps
    "accounts",
    "jobs",
    "applications",
    "interviews",
    "notifications",
]


# --------------------------------------------------
# MIDDLEWARE
# --------------------------------------------------

MIDDLEWARE = [
    # CORS middleware must be near the top
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# --------------------------------------------------
# URL AND WSGI CONFIGURATION
# --------------------------------------------------

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# --------------------------------------------------
# TEMPLATES
# --------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# --------------------------------------------------
# DATABASE - POSTGRESQL / SQLITE
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

REQUIRE_DATABASE_URL = os.getenv(
    "REQUIRE_DATABASE_URL", "False"
).lower() in ("true", "1", "yes")

if REQUIRE_DATABASE_URL and not DATABASE_URL:
    raise ImproperlyConfigured(
        "DATABASE_URL is required for production."
    )

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# --------------------------------------------------
# PASSWORD VALIDATION
# --------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# --------------------------------------------------
# INTERNATIONALIZATION
# --------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "Asia/Kolkata")

USE_I18N = True

USE_TZ = True


# --------------------------------------------------
# STATIC FILES - WHITENOISE
# --------------------------------------------------

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# --------------------------------------------------
# MEDIA STORAGE - LOCAL OR CLOUDFLARE R2
# --------------------------------------------------

USE_CLOUD_STORAGE = os.getenv(
    "USE_CLOUD_STORAGE", "False"
).lower() in ("true", "1", "yes")

if USE_CLOUD_STORAGE:

    try:
        import storages  # noqa: F401
    except ImportError as exc:
        raise ImproperlyConfigured(
            "Install django-storages with its S3 support."
        ) from exc

    cloud_storage_settings = {
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
        "AWS_SECRET_ACCESS_KEY": os.getenv(
            "AWS_SECRET_ACCESS_KEY"
        ),
        "AWS_STORAGE_BUCKET_NAME": os.getenv(
            "AWS_STORAGE_BUCKET_NAME"
        ),
        "AWS_S3_ENDPOINT_URL": os.getenv(
            "AWS_S3_ENDPOINT_URL"
        ),
    }

    missing_settings = [
        key
        for key, value in cloud_storage_settings.items()
        if not value
    ]

    if missing_settings:
        raise ImproperlyConfigured(
            "Missing Cloudflare R2 settings: "
            + ", ".join(missing_settings)
        )

    AWS_ACCESS_KEY_ID = cloud_storage_settings[
        "AWS_ACCESS_KEY_ID"
    ]

    AWS_SECRET_ACCESS_KEY = cloud_storage_settings[
        "AWS_SECRET_ACCESS_KEY"
    ]

    AWS_STORAGE_BUCKET_NAME = cloud_storage_settings[
        "AWS_STORAGE_BUCKET_NAME"
    ]

    AWS_S3_ENDPOINT_URL = cloud_storage_settings[
        "AWS_S3_ENDPOINT_URL"
    ]

    AWS_S3_REGION_NAME = os.getenv(
        "AWS_S3_REGION_NAME", "auto"
    )

    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_S3_ADDRESSING_STYLE = "path"
    AWS_QUERYSTRING_AUTH = True
    AWS_QUERYSTRING_EXPIRE = 3600
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False

    DEFAULT_STORAGE_BACKEND = (
        "storages.backends.s3.S3Storage"
    )

else:
    DEFAULT_STORAGE_BACKEND = (
        "django.core.files.storage.FileSystemStorage"
    )

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {
        "BACKEND": DEFAULT_STORAGE_BACKEND,
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        ),
    },
}


# --------------------------------------------------
# CUSTOM USER MODEL
# --------------------------------------------------

AUTH_USER_MODEL = "accounts.User"


# --------------------------------------------------
# EMAIL CONFIGURATION
# --------------------------------------------------

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    (
        "django.core.mail.backends.console.EmailBackend"
        if DEBUG
        else "django.core.mail.backends.smtp.EmailBackend"
    ),
)

EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")

EMAIL_PORT = int(os.getenv("EMAIL_PORT", "25"))

EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS", "False"
).lower() in ("true", "1", "yes")

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")

EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD", ""
)

DEFAULT_FROM_EMAIL = (
    os.getenv("DEFAULT_FROM_EMAIL")
    or EMAIL_HOST_USER
    or "recruitpro4401@gmail.com"
)

CONTACT_EMAIL_BACKEND = os.getenv(
    "CONTACT_EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend",
)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "onboarding@resend.dev",
)

SUPPORT_EMAIL = os.getenv(
    "SUPPORT_EMAIL",
    "recruitpro4401@gmail.com",
)

FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL",
    "http://localhost:5173",
)


# --------------------------------------------------
# DJANGO REST FRAMEWORK + JWT
# --------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "contact_support": "5/hour",
    },
}


# --------------------------------------------------
# DEFAULT PRIMARY KEY
# --------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
