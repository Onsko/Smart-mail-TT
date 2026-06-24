# MongoDB Seed — Smart Mail

## Nom de la base de données
```
smartmail_db
```

## Importer les collections (mongoimport)

```bash
mongoimport --db smartmail_db --collection services    --file services.json    --jsonArray
mongoimport --db smartmail_db --collection users       --file users.json       --jsonArray
mongoimport --db smartmail_db --collection courriers   --file courriers.json   --jsonArray
mongoimport --db smartmail_db --collection documents   --file documents.json   --jsonArray
mongoimport --db smartmail_db --collection ia_analyses --file ia_analyses.json --jsonArray
mongoimport --db smartmail_db --collection historiques --file historiques.json --jsonArray
mongoimport --db smartmail_db --collection reponses    --file reponses.json    --jsonArray
mongoimport --db smartmail_db --collection notifications --file notifications.json --jsonArray
```

## Ordre d'import (respecter les dépendances)
1. services
2. users
3. courriers
4. documents
5. ia_analyses
6. historiques
7. reponses
8. notifications
