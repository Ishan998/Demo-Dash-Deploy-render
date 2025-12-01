from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_banner_device_type_banner_display_order_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='HomeCollageItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120)),
                ('item_type', models.CharField(choices=[('occasion', 'Occasion'), ('crystal', 'Crystal')], max_length=20)),
                ('image', models.ImageField(blank=True, null=True, upload_to='collages/')),
                ('image_url', models.URLField(blank=True, null=True)),
                ('grid_class', models.CharField(blank=True, default='', max_length=80)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('redirect_url', models.URLField(blank=True, null=True)),
            ],
            options={
                'ordering': ['display_order', 'name', 'id'],
            },
        ),
    ]
