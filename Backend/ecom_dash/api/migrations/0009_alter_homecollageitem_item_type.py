from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_homecollageitem'),
    ]

    operations = [
        migrations.AlterField(
            model_name='homecollageitem',
            name='item_type',
            field=models.CharField(choices=[('occasion', 'Occasion'), ('crystal', 'Crystal'), ('product_type', 'Product Type')], max_length=20),
        ),
    ]
