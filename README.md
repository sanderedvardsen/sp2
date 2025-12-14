# Auction House

En auksjonsplattform bygget med vanilla TypeScript og Vite.

## Funksjoner

- **Autentisering**: Registrering og innlogging med automatisk API-nøkkelgenerering
- **Live auksjoner**: Vis aktive auksjoner med søk og sortering (nyeste, slutter snart, pris)
- **Budgivning**: Legg inn bud på auksjoner med kredittbasert system
- **Profil**: Se dine bud, oppføringer og gevinster
- **Opprett auksjoner**: Lag nye auksjoner med tittel, beskrivelse, bilder og sluttdato
- **Administrer auksjoner**: Rediger og slett egne auksjoner
- **Responsiv design**: Fungerer på mobil, tablet og desktop

## Teknologi

- **TypeScript** - Type-sikker JavaScript
- **Vite** - Rask utviklingsserver og byggeverktøy
- **Vanilla CSS** - Egendefinerte stiler med media queries
- **Noroff Auction API v2** - Backend API

## Kom i gang

### Installasjon

```bash
npm install
```

### Utvikling

```bash
npm run dev
```

Applikasjonen kjører på `http://localhost:3000`

### Bygg for produksjon

```bash
npm run build
```

## Bruk

1. **Registrer deg** eller logg inn med en Noroff-e-post (@noroff.no eller @stud.noroff.no)
2. **Bla gjennom auksjoner** på forsiden (du kan bla gjennom auksjoner uten å logge inn)
3. **Søk og sorter** for å finne interessante auksjoner
4. **Legg inn bud** på auksjoner (krever innlogging)
5. **Opprett egne auksjoner** via profilsiden
6. **Følg med** på dine bud og gevinster i profilen

## Mappestruktur

```
src/
├── components/      # UI-komponenter
├── lib/            # API og autentisering
├── styles/         # CSS-filer
└── main.ts         # Applikasjonsinngang
```

## API

Applikasjonen bruker [Noroff Auction API v2](https://docs.noroff.dev/docs/v2/auction-house/listings). API-nøkkel genereres automatisk ved første innlogging.

## Lisens

Dette er et studentprosjekt for Noroff.
  