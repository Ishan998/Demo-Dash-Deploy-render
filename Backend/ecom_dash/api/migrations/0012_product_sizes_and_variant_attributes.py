from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_product_limited_deal_ends_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="sizes",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="colors",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="sizes",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
