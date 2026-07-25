# Azahar — Seed content plan (categories, facets, 50 products, images)

> Asset for ticket **06 — Category taxonomy & 50-item seed plan**. This is *content*, not code:
> a builder transcribes it into the typed `data/` modules from ticket 04 (`data/categories.ts`,
> `data/products.ts`). All slugs are ASCII (URL-safe per ticket 05). Prices are USD, stored as
> **integer minor units (cents)** per ticket 01. No real client assets — placeholder images per
> the manifest at the end.

---

## 1. Facet vocabularies (enumerated content — the "shape" was fixed in ticket 01)

**Occasion** (`occasions[]`, multi-value, URL key `occ`)

| slug | label |
|------|-------|
| `amor` | Amor y romance |
| `cumpleanos` | Cumpleaños |
| `aniversario` | Aniversario |
| `bodas` | Bodas |
| `condolencias` | Condolencias |
| `dia-de-la-madre` | Día de la Madre |
| `graduacion` | Graduación |
| `nuevo-bebe` | Nuevo bebé |

**Flower type** (`flowerTypes[]`, multi-value, URL key `ft`)

| slug | label |
|------|-------|
| `rosas` | Rosas |
| `girasoles` | Girasoles |
| `orquideas` | Orquídeas |
| `lirios` | Lirios |
| `tulipanes` | Tulipanes |
| `gerberas` | Gerberas |
| `claveles` | Claveles |
| `mixtas` | Flores mixtas |

**Colour** (`colours[]`, multi-value, URL key `col`)

| slug | label |
|------|-------|
| `rojo` | Rojo |
| `rosado` | Rosado |
| `blanco` | Blanco |
| `amarillo` | Amarillo |
| `naranja` | Naranja |
| `morado` | Morado |
| `azul` | Azul |
| `multicolor` | Multicolor |

**Size** (`size`, single-value, URL key `sz`)

| slug | label |
|------|-------|
| `pequeno` | Pequeño |
| `mediano` | Mediano |
| `grande` | Grande |

> **Price range** (`pr`) is a *derived* facet (ticket 05 buckets `0-25 / 25-50 / 50-100 / 100+`),
> computed from `priceUsdCents` — never stored on the product.

---

## 2. Categories (10 — presentation/format axis, exactly one per product)

| slug | name | description | heroImage |
|------|------|-------------|-----------|
| `ramos` | Ramos | Ramos de flores frescas para toda ocasión. | `categories/ramos.jpg` |
| `arreglos` | Arreglos florales | Arreglos elaborados en base, listos para sorprender. | `categories/arreglos.jpg` |
| `cajas` | Cajas de flores | Flores presentadas en elegantes cajas de regalo. | `categories/cajas.jpg` |
| `canastas` | Canastas | Canastas florales generosas para celebrar en grande. | `categories/canastas.jpg` |
| `floreros` | Floreros | Arreglos en florero, listos para lucir en casa. | `categories/floreros.jpg` |
| `plantas` | Plantas | Plantas vivas que duran mucho más que un ramo. | `categories/plantas.jpg` |
| `coronas` | Coronas fúnebres | Coronas y homenajes florales para despedidas. | `categories/coronas.jpg` |
| `centros-de-mesa` | Centros de mesa | Centros de mesa para bodas, eventos y celebraciones. | `categories/centros-de-mesa.jpg` |
| `rosas-preservadas` | Rosas preservadas | Rosas eternas que duran años, sin agua. | `categories/rosas-preservadas.jpg` |
| `detalles` | Detalles | Pequeños detalles con flores, globos y chocolates. | `categories/detalles.jpg` |

---

## 3. Products (50)

### 3a. Structured data (identity · price · category · size · featured · image)

`image` is `images[0]` (primary); path is relative to `public/images/products/`. Featured ⭐; the
**flagship** (first featured, powers the home hero per ticket 05) is **p07**.

| id | slug | name | category | price | cents | size | ⭐ | image |
|----|------|------|----------|------:|------:|------|:--:|-------|
| p01 | `ramo-amor-rojo` | Ramo Amor Rojo | ramos | $32 | 3200 | mediano | ⭐ | `rosas-rojas-ramo.jpg` |
| p02 | `ramo-girasoles-radiantes` | Ramo Girasoles Radiantes | ramos | $23 | 2300 | pequeno | | `girasoles.jpg` |
| p03 | `ramo-primavera-mixto` | Ramo Primavera Mixto | ramos | $24 | 2400 | pequeno | | `mixto-colorido.jpg` |
| p04 | `ramo-tulipanes-pastel` | Ramo Tulipanes Pastel | ramos | $38 | 3800 | mediano | | `tulipanes.jpg` |
| p05 | `ramo-rosas-blancas-elegance` | Ramo Rosas Blancas Elegance | ramos | $45 | 4500 | mediano | | `rosas-blancas.jpg` |
| p06 | `ramo-gerberas-alegres` | Ramo Gerberas Alegres | ramos | $22 | 2200 | pequeno | | `gerberas.jpg` |
| p07 | `ramo-deluxe-24-rosas` | Ramo Deluxe 24 Rosas | ramos | $68 | 6800 | grande | ⭐ | `rosas-rojas-ramo.jpg` |
| p08 | `ramo-lirios-y-rosas` | Ramo Lirios & Rosas | ramos | $48 | 4800 | grande | | `lirios-blancos.jpg` |
| p09 | `arreglo-orquideas-zen` | Arreglo Orquídeas Zen | arreglos | $75 | 7500 | mediano | ⭐ | `orquideas.jpg` |
| p10 | `arreglo-campo-silvestre` | Arreglo Campo Silvestre | arreglos | $42 | 4200 | mediano | | `mixto-colorido.jpg` |
| p11 | `arreglo-rosas-premium` | Arreglo Rosas Premium | arreglos | $88 | 8800 | grande | | `arreglo-premium.jpg` |
| p12 | `arreglo-lirios-serenidad` | Arreglo Lirios Serenidad | arreglos | $49 | 4900 | mediano | | `lirios-blancos.jpg` |
| p13 | `arreglo-tropical-paraiso` | Arreglo Tropical Ave del Paraíso | arreglos | $95 | 9500 | grande | | `arreglo-premium.jpg` |
| p14 | `arreglo-girasoles-de-sol` | Arreglo Girasoles de Sol | arreglos | $46 | 4600 | mediano | | `girasoles.jpg` |
| p15 | `arreglo-gran-boda-blanco` | Arreglo Gran Boda Blanco | arreglos | $130 | 13000 | grande | | `rosas-blancas.jpg` |
| p16 | `caja-sorpresa-roja` | Caja Sorpresa Roja | cajas | $35 | 3500 | pequeno | | `caja-rosas.jpg` |
| p17 | `caja-rosas-y-chocolates` | Caja Rosas & Chocolates | cajas | $48 | 4800 | mediano | ⭐ | `caja-rosas.jpg` |
| p18 | `caja-pastel-tulipanes` | Caja Pastel de Tulipanes | cajas | $44 | 4400 | mediano | | `tulipanes.jpg` |
| p19 | `caja-grande-deluxe` | Caja Grande Deluxe | cajas | $72 | 7200 | grande | | `caja-rosas.jpg` |
| p20 | `caja-blanca-pureza` | Caja Blanca Pureza | cajas | $40 | 4000 | mediano | | `rosas-blancas.jpg` |
| p21 | `caja-girasol-feliz` | Caja Girasol Feliz | cajas | $24 | 2400 | pequeno | | `girasoles.jpg` |
| p22 | `canasta-frutal-floral` | Canasta Frutal Floral | canastas | $65 | 6500 | grande | | `canasta-flores.jpg` |
| p23 | `canasta-rosas-del-campo` | Canasta Rosas del Campo | canastas | $46 | 4600 | mediano | | `canasta-flores.jpg` |
| p24 | `canasta-primaveral` | Canasta Primaveral | canastas | $47 | 4700 | mediano | | `mixto-colorido.jpg` |
| p25 | `canasta-condolencias-serena` | Canasta Condolencias Serena | canastas | $85 | 8500 | grande | | `lirios-blancos.jpg` |
| p26 | `canasta-gran-celebracion` | Canasta Gran Celebración | canastas | $110 | 11000 | grande | | `canasta-flores.jpg` |
| p27 | `florero-rosas-clasico` | Florero Rosas Clásico | floreros | $49 | 4900 | mediano | | `florero-arreglo.jpg` |
| p28 | `florero-lirios-y-orquideas` | Florero Lirios & Orquídeas | floreros | $78 | 7800 | grande | ⭐ | `orquideas.jpg` |
| p29 | `florero-campo-alegre` | Florero Campo Alegre | floreros | $47 | 4700 | mediano | | `mixto-colorido.jpg` |
| p30 | `florero-tulipanes-holandeses` | Florero Tulipanes Holandeses | floreros | $48 | 4800 | mediano | | `tulipanes.jpg` |
| p31 | `florero-blanco-elegante` | Florero Blanco Elegante | floreros | $92 | 9200 | grande | | `florero-arreglo.jpg` |
| p32 | `planta-suculenta-maceta` | Suculenta en Maceta | plantas | $18 | 1800 | pequeno | | `planta-suculenta.jpg` |
| p33 | `orquidea-phalaenopsis` | Orquídea Phalaenopsis | plantas | $55 | 5500 | mediano | ⭐ | `orquidea-planta.jpg` |
| p34 | `planta-ficus-decorativa` | Planta Ficus Decorativa | plantas | $40 | 4000 | mediano | | `planta-verde.jpg` |
| p35 | `bonsai-elegante` | Bonsái Elegante | plantas | $70 | 7000 | mediano | | `planta-verde.jpg` |
| p36 | `planta-lirio-de-la-paz` | Planta Lirio de la Paz | plantas | $21 | 2100 | pequeno | | `planta-verde.jpg` |
| p37 | `centro-mesa-boda-clasico` | Centro de Mesa Boda Clásico | centros-de-mesa | $120 | 12000 | grande | | `centro-mesa.jpg` |
| p38 | `centro-mesa-rustico` | Centro de Mesa Rústico | centros-de-mesa | $58 | 5800 | mediano | | `centro-mesa.jpg` |
| p39 | `centro-mesa-elegante-rosa` | Centro de Mesa Elegante Rosa | centros-de-mesa | $95 | 9500 | grande | | `centro-mesa.jpg` |
| p40 | `centro-mesa-tropical` | Centro de Mesa Tropical | centros-de-mesa | $49 | 4900 | mediano | | `centro-mesa.jpg` |
| p41 | `rosa-eterna-cupula` | Rosa Eterna en Cúpula | rosas-preservadas | $62 | 6200 | pequeno | ⭐ | `rosa-preservada.jpg` |
| p42 | `caja-rosas-preservadas-premium` | Caja Rosas Preservadas Premium | rosas-preservadas | $115 | 11500 | mediano | | `rosa-preservada.jpg` |
| p43 | `rosa-preservada-mini` | Rosa Preservada Mini | rosas-preservadas | $45 | 4500 | pequeno | | `rosa-preservada.jpg` |
| p44 | `ramo-preservado-deluxe` | Ramo Preservado Deluxe | rosas-preservadas | $140 | 14000 | grande | | `rosa-preservada.jpg` |
| p45 | `corona-funebre-clasica` | Corona Fúnebre Clásica | coronas | $130 | 13000 | grande | | `corona-funebre.jpg` |
| p46 | `corona-condolencias-blanca` | Corona Condolencias Blanca | coronas | $95 | 9500 | grande | | `corona-funebre.jpg` |
| p47 | `corona-homenaje-premium` | Corona Homenaje Premium | coronas | $165 | 16500 | grande | | `corona-funebre.jpg` |
| p48 | `detalle-ramo-mini-globo` | Ramo Mini + Globo | detalles | $20 | 2000 | pequeno | | `detalle-globo.jpg` |
| p49 | `detalle-rosa-chocolates` | Detalle Rosa + Chocolates | detalles | $19 | 1900 | pequeno | | `detalle-globo.jpg` |
| p50 | `detalle-girasol-peluche` | Detalle Girasol + Peluche | detalles | $23 | 2300 | pequeno | | `detalle-globo.jpg` |

### 3b. Facets (occasions · flowerTypes · colours)

Plants that are pure foliage carry **empty** `flowerTypes` / `colours` (the facet simply won't match
them — expected, per ticket 03/01). Comma-separated = multiple values.

| id | occasions | flowerTypes | colours |
|----|-----------|-------------|---------|
| p01 | amor, aniversario | rosas | rojo |
| p02 | cumpleanos, graduacion | girasoles | amarillo |
| p03 | cumpleanos | mixtas, claveles | multicolor, azul |
| p04 | amor, dia-de-la-madre | tulipanes | rosado |
| p05 | bodas, condolencias | rosas | blanco |
| p06 | cumpleanos, nuevo-bebe | gerberas, claveles | naranja, multicolor |
| p07 | amor, aniversario | rosas | rojo |
| p08 | aniversario, dia-de-la-madre | lirios, rosas | rosado, blanco |
| p09 | aniversario | orquideas | morado, blanco |
| p10 | cumpleanos | mixtas, gerberas, claveles | multicolor, naranja |
| p11 | amor, aniversario | rosas | rojo, rosado |
| p12 | condolencias | lirios | blanco |
| p13 | cumpleanos | mixtas | naranja, multicolor, azul |
| p14 | cumpleanos, graduacion | girasoles | amarillo |
| p15 | bodas | rosas, lirios | blanco |
| p16 | amor | rosas | rojo |
| p17 | amor, aniversario | rosas | rojo, rosado |
| p18 | dia-de-la-madre | tulipanes | rosado, morado |
| p19 | amor, aniversario | rosas, mixtas | multicolor, azul |
| p20 | nuevo-bebe, condolencias | rosas, lirios | blanco |
| p21 | cumpleanos | girasoles | amarillo |
| p22 | nuevo-bebe, cumpleanos | mixtas | multicolor |
| p23 | cumpleanos, aniversario | rosas, gerberas | multicolor |
| p24 | dia-de-la-madre | mixtas, tulipanes, claveles | rosado, amarillo |
| p25 | condolencias | lirios, rosas | blanco |
| p26 | bodas, aniversario | mixtas, orquideas | multicolor |
| p27 | amor, aniversario | rosas | rojo |
| p28 | aniversario, dia-de-la-madre | lirios, orquideas | blanco, morado |
| p29 | cumpleanos | gerberas, mixtas | multicolor |
| p30 | dia-de-la-madre | tulipanes | rosado, amarillo |
| p31 | bodas, condolencias | rosas, lirios | blanco |
| p32 | cumpleanos | *(none)* | *(none)* |
| p33 | aniversario, dia-de-la-madre | orquideas | blanco, morado |
| p34 | cumpleanos | *(none)* | *(none)* |
| p35 | aniversario, graduacion | *(none)* | *(none)* |
| p36 | condolencias, nuevo-bebe | *(none)* | blanco |
| p37 | bodas | rosas, lirios | blanco |
| p38 | cumpleanos, aniversario | mixtas, girasoles | multicolor, amarillo |
| p39 | bodas, aniversario | rosas | rosado |
| p40 | cumpleanos | mixtas | naranja, multicolor |
| p41 | amor, aniversario | rosas | rojo |
| p42 | amor, aniversario | rosas | rosado |
| p43 | amor | rosas | rojo |
| p44 | amor, aniversario, bodas | rosas | multicolor, azul |
| p45 | condolencias | rosas, lirios | blanco |
| p46 | condolencias | lirios, gerberas | blanco |
| p47 | condolencias | rosas, lirios, mixtas | blanco, rojo |
| p48 | cumpleanos, nuevo-bebe | mixtas | multicolor |
| p49 | amor | rosas | rojo |
| p50 | cumpleanos, nuevo-bebe | girasoles | amarillo |

### 3c. Copy (tagline + description — Spanish)

`tagline` = short line for cards (`tagline?`). `description` = product-detail copy. All copy is
demo-grade; the client will refine, but every product ships complete.

| id | tagline | description |
|----|---------|-------------|
| p01 | Doce rosas rojas para decir "te amo" | Un clásico ramo de doce rosas rojas de tallo largo, envuelto a mano. El regalo perfecto para expresar amor y pasión. |
| p02 | Girasoles que alegran el día | Ramo de girasoles frescos y radiantes que llenan de energía cualquier espacio. Ideal para felicitar o dar ánimo. |
| p03 | Un jardín de primavera en tus manos | Ramo mixto y colorido con flores de temporada. Alegre, fresco y económico para cualquier ocasión. |
| p04 | Tulipanes en tonos pastel | Delicado ramo de tulipanes en tonos suaves, perfecto para sorprender con elegancia y ternura. |
| p05 | Elegancia en blanco | Ramo de rosas blancas de tallo largo, símbolo de pureza y respeto. Perfecto para bodas o condolencias. |
| p06 | Gerberas llenas de color | Ramo alegre de gerberas multicolor que transmite frescura y buena vibra. Ideal para celebrar. |
| p07 | Nuestro ramo insignia: 24 rosas | Espectacular ramo de dos docenas de rosas rojas premium. El máximo gesto de amor, presentado con lujo. |
| p08 | Lirios y rosas en armonía | Ramo grande que combina lirios y rosas en tonos rosados y blancos. Sofisticado y aromático. |
| p09 | Serenidad en cada orquídea | Arreglo zen de orquídeas en base, de líneas limpias y presencia elegante. Un detalle de distinción. |
| p10 | El encanto del campo | Arreglo silvestre con flores mixtas y gerberas, natural y colorido, como recién cortado del jardín. |
| p11 | Rosas premium en su máxima expresión | Imponente arreglo de rosas en tonos rojo y rosado, montado en base. Lujo floral para ocasiones especiales. |
| p12 | Paz y serenidad en lirios | Arreglo sobrio de lirios blancos, ideal para acompañar en momentos de duelo con respeto y elegancia. |
| p13 | Un toque tropical y exótico | Vibrante arreglo tropical con flores exóticas y acentos de color. Diferente, llamativo e inolvidable. |
| p14 | Sol en forma de flores | Arreglo de girasoles en base que irradia alegría. Perfecto para felicitar, graduaciones y cumpleaños. |
| p15 | Grandeza para tu gran día | Arreglo monumental de rosas y lirios blancos para bodas y grandes celebraciones. Presencia inolvidable. |
| p16 | Una caja llena de sorpresas | Compacta caja de rosas rojas, lista para regalar. Pequeña en tamaño, enorme en detalle. |
| p17 | Rosas y chocolates, el dúo perfecto | Caja de rosas acompañada de finos chocolates. La combinación clásica para conquistar. |
| p18 | Tulipanes en caja de regalo | Caja pastel con tulipanes en tonos rosado y morado. Moderna, delicada y siempre bien recibida. |
| p19 | La caja deluxe que lo tiene todo | Gran caja de rosas y flores mixtas en un despliegue de color. Nuestro formato en caja más generoso. |
| p20 | Pureza en una caja | Caja de rosas y lirios blancos, elegante y serena. Ideal para un nuevo bebé o un gesto de respeto. |
| p21 | Girasoles que no dejan de sonreír | Caja pequeña de girasoles, alegre y luminosa. Un detalle económico que ilumina cualquier día. |
| p22 | Flores y frutas para celebrar | Generosa canasta que combina flores frescas con frutas. Perfecta para dar la bienvenida o felicitar. |
| p23 | El campo en una canasta | Canasta de rosas y gerberas en un montaje campestre y colorido. Cálida y acogedora. |
| p24 | Primavera para mamá | Canasta primaveral de flores mixtas y tulipanes. Un homenaje colorido, ideal para el Día de la Madre. |
| p25 | Acompañar con serenidad | Canasta sobria de lirios y rosas blancas para expresar condolencias con delicadeza y respeto. |
| p26 | Para las grandes celebraciones | Imponente canasta de flores mixtas y orquídeas. El regalo ideal para bodas y aniversarios memorables. |
| p27 | Rosas listas para lucir | Florero clásico de rosas rojas, listo para colocar y disfrutar. Elegancia sin complicaciones. |
| p28 | Lirios y orquídeas de lujo | Florero premium que combina lirios y orquídeas. Una pieza sofisticada para decorar y sorprender. |
| p29 | Alegría de campo en florero | Florero de gerberas y flores mixtas, colorido y desenfadado. Da vida a cualquier rincón del hogar. |
| p30 | Tulipanes holandeses en florero | Florero de tulipanes en tonos rosado y amarillo. Fresco, luminoso y siempre elegante. |
| p31 | Blanco elegante para lucir | Florero de rosas y lirios blancos, de líneas puras. Perfecto para bodas o para decorar con distinción. |
| p32 | Una suculenta que dura | Suculenta en maceta decorativa, resistente y de bajo mantenimiento. Un detalle verde que perdura. |
| p33 | La elegancia de la orquídea viva | Orquídea Phalaenopsis en maceta, símbolo de refinamiento. Un regalo vivo que dura semanas en flor. |
| p34 | Verde para toda la casa | Planta de ficus decorativa en maceta. Ideal para regalar o decorar espacios con un toque natural. |
| p35 | El arte del bonsái | Bonsái cuidadosamente formado en maceta de cerámica. Un regalo sereno y de gran significado. |
| p36 | La planta que purifica | Lirio de la paz en maceta, elegante y purificador del aire. Ideal para acompañar o dar la bienvenida. |
| p37 | El centro de tu gran día | Centro de mesa clásico de rosas y lirios blancos para bodas. Elegancia que corona cualquier evento. |
| p38 | Rústico y acogedor | Centro de mesa rústico con flores mixtas y girasoles. Cálido y natural para reuniones y celebraciones. |
| p39 | Rosa elegante para la mesa | Centro de mesa de rosas en tono rosado, sofisticado y romántico. Ideal para bodas y aniversarios. |
| p40 | Un centro con aire tropical | Centro de mesa tropical de flores mixtas en tonos vivos. Diferente y lleno de energía para tu evento. |
| p41 | Una rosa que dura años | Rosa preservada en cúpula de cristal, eterna y sin cuidados. Amor que no se marchita. |
| p42 | Rosas eternas de lujo | Caja premium de rosas preservadas que conservan su belleza por años. El regalo definitivo. |
| p43 | Un detalle eterno | Mini rosa preservada, pequeña pero inolvidable. Un recuerdo de amor que perdura en el tiempo. |
| p44 | El ramo que nunca se marchita | Espectacular ramo de rosas preservadas multicolor. Belleza duradera para ocasiones únicas. |
| p45 | Un homenaje con respeto | Corona fúnebre clásica de rosas y lirios blancos, para acompañar en la despedida con dignidad. |
| p46 | Blanco de despedida | Corona de lirios y gerberas blancas, serena y respetuosa. Un homenaje floral sentido. |
| p47 | El homenaje más completo | Gran corona de rosas, lirios y flores mixtas. Nuestro tributo floral más imponente y solemne. |
| p48 | Flores con un globo de regalo | Mini ramo acompañado de un globo festivo. Un detalle alegre para cumpleaños y nacimientos. |
| p49 | Una rosa y chocolates | Rosa individual con caja de chocolates. El detalle romántico perfecto para cualquier día. |
| p50 | Girasol con peluche | Girasol acompañado de un tierno peluche. Un regalo dulce para sorprender y celebrar. |

---

## 4. Placeholder images (curated Unsplash pool — reused by category / flower type)

**Strategy (ticket 06 decision):** curated **Unsplash** photos, downloaded to local files, reused
across products. The **Unsplash License** permits free commercial use with no attribution required
— license-safe for the demo. No runtime hotlinking (static export, ticket 04): the builder
downloads each once into `public/images/`.

**Pool — 19 product images** → `public/images/products/<file>`. Pick any good match from the
suggested Unsplash search and save under the given filename:

| file | intent | Unsplash search |
|------|--------|-----------------|
| `rosas-rojas-ramo.jpg` | red-rose bouquet | https://unsplash.com/s/photos/red-roses-bouquet |
| `rosas-blancas.jpg` | white roses | https://unsplash.com/s/photos/white-roses |
| `girasoles.jpg` | sunflowers | https://unsplash.com/s/photos/sunflower-bouquet |
| `tulipanes.jpg` | tulips | https://unsplash.com/s/photos/tulips |
| `orquideas.jpg` | orchid arrangement | https://unsplash.com/s/photos/orchid-arrangement |
| `lirios-blancos.jpg` | white lilies | https://unsplash.com/s/photos/white-lilies |
| `gerberas.jpg` | colourful gerberas | https://unsplash.com/s/photos/gerbera-daisies |
| `mixto-colorido.jpg` | mixed colourful bouquet | https://unsplash.com/s/photos/colorful-flower-bouquet |
| `caja-rosas.jpg` | roses in a gift box | https://unsplash.com/s/photos/flower-box |
| `canasta-flores.jpg` | flower basket | https://unsplash.com/s/photos/flower-basket |
| `florero-arreglo.jpg` | vase arrangement | https://unsplash.com/s/photos/flowers-in-vase |
| `arreglo-premium.jpg` | lush premium arrangement | https://unsplash.com/s/photos/luxury-flower-arrangement |
| `centro-mesa.jpg` | table centrepiece | https://unsplash.com/s/photos/floral-centerpiece |
| `corona-funebre.jpg` | funeral wreath | https://unsplash.com/s/photos/funeral-wreath |
| `rosa-preservada.jpg` | preserved rose in dome | https://unsplash.com/s/photos/preserved-rose-dome |
| `detalle-globo.jpg` | flowers with balloon/teddy | https://unsplash.com/s/photos/flowers-and-balloon |
| `planta-suculenta.jpg` | potted succulent | https://unsplash.com/s/photos/succulent-pot |
| `planta-verde.jpg` | green potted plant | https://unsplash.com/s/photos/potted-plant |
| `orquidea-planta.jpg` | phalaenopsis orchid plant | https://unsplash.com/s/photos/phalaenopsis |

**Category heroes — 10 images** → `public/images/categories/<slug>.jpg`. Reuse the closest pool
photo or pick a wider/lifestyle shot from the same searches (e.g. `categories/ramos.jpg` from the
red-roses search, `categories/plantas.jpg` from potted-plant, etc.).

> All 50 products carry exactly one image (`images[0]`). `images` is an array (ticket 01) so extra
> angles can be added later; the seed ships one each to stay lean.

---

## 5. Builder invariants (self-check after transcription)

- **Counts:** 50 products; per category 8/7/6/5/5/5/4/4/3/3 (ramos…detalles as ordered in §2).
- **Price buckets** (so every `pr` filter returns hits): `0-25` → 9 · `25-50` → 19 · `50-100` → 15
  · `100+` → 7. Boundary rule: `0-25` = `< 2500`, `25-50` = `2500–4999`, `50-100` = `5000–9999`,
  `100+` = `>= 10000` cents.
- **Featured:** 7 (`p01, p07, p09, p17, p28, p33, p41`); **flagship = p07** (list it first / expose
  as the home hero per ticket 05).
- **Facet coverage** (no filter dead-ends — every value has ≥3 products): occasions all ≥3
  (graduacion is the tightest at 3: p02/p14/p35); flowerTypes all ≥4; colours all ≥3 (naranja &
  azul at 4); sizes all present.
- **Every product** has exactly one `categorySlug`, a unique `slug`, `priceUsdCents` as an integer,
  and `images.length >= 1`. Foliage plants (p32/p34/p35) legitimately have empty
  `flowerTypes`/`colours`.
- **Slugs** are ASCII, hyphenated, unique — safe as `/producto/[slug]` and as facet URL values.
