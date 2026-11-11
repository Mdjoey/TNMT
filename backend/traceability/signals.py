from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Batch, EnvData
from .services import calculate_eco_score, generate_qr_code

@receiver(post_save, sender=Batch)
def on_batch_created(sender, instance, created, **kwargs):
    if created and not instance.qr_code_image:
        generate_qr_code(instance)
        instance.save(update_fields=['qr_code_image'])

@receiver(post_save, sender=EnvData)
def on_env_data_saved(sender, instance, **kwargs):
    batch = instance.batch
    score, grade = calculate_eco_score(batch)
    batch.eco_score = score
    batch.eco_grade = grade
    batch.save(update_fields=['eco_score', 'eco_grade'])