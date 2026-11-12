from django.db import transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Application


@receiver(post_delete, sender=Application)
def delete_unused_resume_file(sender, instance, using, **kwargs):
    if not instance.resume:
        return

    storage = instance.resume.storage
    name = instance.resume.name

    def delete_if_unused():
        if not Application.objects.using(using).filter(resume=name).exists():
            storage.delete(name)

    transaction.on_commit(delete_if_unused, using=using)
