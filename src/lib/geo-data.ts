/**
 * GeoJSON polygons for Tijuana zones.
 * Zona Río uses real boundary from OpenStreetMap/Nominatim.
 * Other zones use carefully crafted non-overlapping approximate polygons.
 * Coordinates in GeoJSON standard [lng, lat] order.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ZONE_GEOJSON: GeoJSON.FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 0,
      "properties": {
        "slug": "zona-rio",
        "name": "Zona R\u00edo"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.040198,
              32.541491
            ],
            [
              -117.034539,
              32.538472
            ],
            [
              -117.033987,
              32.537492
            ],
            [
              -117.033804,
              32.535701
            ],
            [
              -117.03211,
              32.535772
            ],
            [
              -117.031971,
              32.534529
            ],
            [
              -117.031431,
              32.534589
            ],
            [
              -117.029833,
              32.531826
            ],
            [
              -117.02554,
              32.526536
            ],
            [
              -117.024646,
              32.525956
            ],
            [
              -117.024445,
              32.524664
            ],
            [
              -117.018189,
              32.521371
            ],
            [
              -117.015708,
              32.520348
            ],
            [
              -117.015878,
              32.520026
            ],
            [
              -117.015329,
              32.519764
            ],
            [
              -117.015448,
              32.519546
            ],
            [
              -117.01249,
              32.518063
            ],
            [
              -117.012004,
              32.518614
            ],
            [
              -117.009473,
              32.517894
            ],
            [
              -117.007686,
              32.516813
            ],
            [
              -117.006895,
              32.516647
            ],
            [
              -117.00559,
              32.517013
            ],
            [
              -117.005,
              32.517903
            ],
            [
              -117.001957,
              32.517724
            ],
            [
              -117.000373,
              32.517087
            ],
            [
              -117.000713,
              32.519764
            ],
            [
              -117.001734,
              32.520048
            ],
            [
              -117.007229,
              32.52541
            ],
            [
              -117.010786,
              32.52819
            ],
            [
              -117.011904,
              32.530016
            ],
            [
              -117.011711,
              32.529414
            ],
            [
              -117.011952,
              32.529267
            ],
            [
              -117.014807,
              32.534517
            ],
            [
              -117.016444,
              32.536236
            ],
            [
              -117.018718,
              32.537845
            ],
            [
              -117.019287,
              32.536967
            ],
            [
              -117.025434,
              32.539349
            ],
            [
              -117.0259,
              32.540151
            ],
            [
              -117.025172,
              32.541039
            ],
            [
              -117.025773,
              32.540796
            ],
            [
              -117.027138,
              32.541297
            ],
            [
              -117.028228,
              32.542566
            ],
            [
              -117.030409,
              32.542384
            ],
            [
              -117.029553,
              32.541225
            ],
            [
              -117.031498,
              32.540214
            ],
            [
              -117.034379,
              32.542009
            ],
            [
              -117.040198,
              32.541491
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "slug": "playas-de-tijuana",
        "name": "Playas de Tijuana"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.139,
              32.543
            ],
            [
              -117.128,
              32.544
            ],
            [
              -117.118,
              32.54
            ],
            [
              -117.108,
              32.533
            ],
            [
              -117.104,
              32.527
            ],
            [
              -117.103,
              32.52
            ],
            [
              -117.106,
              32.514
            ],
            [
              -117.112,
              32.509
            ],
            [
              -117.12,
              32.508
            ],
            [
              -117.129,
              32.511
            ],
            [
              -117.135,
              32.516
            ],
            [
              -117.14,
              32.524
            ],
            [
              -117.141,
              32.533
            ],
            [
              -117.139,
              32.543
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 2,
      "properties": {
        "slug": "otay",
        "name": "Otay"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -116.975,
              32.548
            ],
            [
              -116.963,
              32.55
            ],
            [
              -116.952,
              32.547
            ],
            [
              -116.943,
              32.541
            ],
            [
              -116.94,
              32.534
            ],
            [
              -116.942,
              32.527
            ],
            [
              -116.948,
              32.522
            ],
            [
              -116.957,
              32.519
            ],
            [
              -116.967,
              32.52
            ],
            [
              -116.975,
              32.524
            ],
            [
              -116.98,
              32.53
            ],
            [
              -116.981,
              32.538
            ],
            [
              -116.975,
              32.548
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 3,
      "properties": {
        "slug": "chapultepec",
        "name": "Chapultepec"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -116.998,
              32.527
            ],
            [
              -116.992,
              32.529
            ],
            [
              -116.985,
              32.528
            ],
            [
              -116.981,
              32.524
            ],
            [
              -116.98,
              32.518
            ],
            [
              -116.982,
              32.513
            ],
            [
              -116.987,
              32.51
            ],
            [
              -116.993,
              32.509
            ],
            [
              -116.998,
              32.512
            ],
            [
              -117.001,
              32.517
            ],
            [
              -117.001,
              32.523
            ],
            [
              -116.998,
              32.527
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 4,
      "properties": {
        "slug": "hipodromo",
        "name": "Hip\u00f3dromo"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.01,
              32.513
            ],
            [
              -117.004,
              32.515
            ],
            [
              -116.997,
              32.513
            ],
            [
              -116.992,
              32.508
            ],
            [
              -116.991,
              32.502
            ],
            [
              -116.993,
              32.496
            ],
            [
              -116.998,
              32.493
            ],
            [
              -117.005,
              32.492
            ],
            [
              -117.011,
              32.495
            ],
            [
              -117.014,
              32.501
            ],
            [
              -117.014,
              32.507
            ],
            [
              -117.01,
              32.513
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 5,
      "properties": {
        "slug": "centro",
        "name": "Centro"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.048,
              32.543
            ],
            [
              -117.04,
              32.545
            ],
            [
              -117.032,
              32.543
            ],
            [
              -117.026,
              32.539
            ],
            [
              -117.023,
              32.534
            ],
            [
              -117.024,
              32.528
            ],
            [
              -117.029,
              32.524
            ],
            [
              -117.036,
              32.522
            ],
            [
              -117.043,
              32.524
            ],
            [
              -117.048,
              32.528
            ],
            [
              -117.05,
              32.534
            ],
            [
              -117.048,
              32.543
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 6,
      "properties": {
        "slug": "residencial-del-bosque",
        "name": "Residencial del Bosque"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.012,
              32.505
            ],
            [
              -117.005,
              32.507
            ],
            [
              -116.998,
              32.505
            ],
            [
              -116.994,
              32.5
            ],
            [
              -116.994,
              32.494
            ],
            [
              -116.997,
              32.489
            ],
            [
              -117.003,
              32.487
            ],
            [
              -117.009,
              32.488
            ],
            [
              -117.014,
              32.492
            ],
            [
              -117.015,
              32.498
            ],
            [
              -117.012,
              32.505
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 7,
      "properties": {
        "slug": "la-mesa",
        "name": "La Mesa"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -116.972,
              32.535
            ],
            [
              -116.963,
              32.537
            ],
            [
              -116.955,
              32.534
            ],
            [
              -116.951,
              32.528
            ],
            [
              -116.951,
              32.521
            ],
            [
              -116.954,
              32.515
            ],
            [
              -116.961,
              32.513
            ],
            [
              -116.969,
              32.514
            ],
            [
              -116.974,
              32.519
            ],
            [
              -116.975,
              32.527
            ],
            [
              -116.972,
              32.535
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 8,
      "properties": {
        "slug": "santa-fe",
        "name": "Santa Fe"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.068,
              32.45
            ],
            [
              -117.058,
              32.453
            ],
            [
              -117.048,
              32.45
            ],
            [
              -117.043,
              32.443
            ],
            [
              -117.043,
              32.434
            ],
            [
              -117.048,
              32.428
            ],
            [
              -117.058,
              32.425
            ],
            [
              -117.068,
              32.428
            ],
            [
              -117.073,
              32.435
            ],
            [
              -117.073,
              32.444
            ],
            [
              -117.068,
              32.45
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 9,
      "properties": {
        "slug": "san-antonio-del-mar",
        "name": "San Antonio del Mar"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -117.097,
              32.458
            ],
            [
              -117.088,
              32.46
            ],
            [
              -117.081,
              32.457
            ],
            [
              -117.078,
              32.451
            ],
            [
              -117.078,
              32.443
            ],
            [
              -117.081,
              32.437
            ],
            [
              -117.088,
              32.434
            ],
            [
              -117.095,
              32.435
            ],
            [
              -117.099,
              32.441
            ],
            [
              -117.1,
              32.449
            ],
            [
              -117.097,
              32.458
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 10,
      "properties": {
        "slug": "el-florido",
        "name": "El Florido"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -116.888,
              32.448
            ],
            [
              -116.875,
              32.451
            ],
            [
              -116.862,
              32.448
            ],
            [
              -116.853,
              32.44
            ],
            [
              -116.85,
              32.43
            ],
            [
              -116.852,
              32.42
            ],
            [
              -116.86,
              32.413
            ],
            [
              -116.872,
              32.41
            ],
            [
              -116.884,
              32.413
            ],
            [
              -116.892,
              32.421
            ],
            [
              -116.894,
              32.432
            ],
            [
              -116.888,
              32.448
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": 11,
      "properties": {
        "slug": "terrazas-de-la-presa",
        "name": "Terrazas de la Presa"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -116.905,
              32.448
            ],
            [
              -116.895,
              32.45
            ],
            [
              -116.886,
              32.447
            ],
            [
              -116.881,
              32.441
            ],
            [
              -116.88,
              32.434
            ],
            [
              -116.882,
              32.428
            ],
            [
              -116.889,
              32.424
            ],
            [
              -116.898,
              32.423
            ],
            [
              -116.906,
              32.427
            ],
            [
              -116.909,
              32.434
            ],
            [
              -116.909,
              32.442
            ],
            [
              -116.905,
              32.448
            ]
          ]
        ]
      }
    }
  ]
} as any

/** Compute centroid of a zone polygon by averaging all coordinates */
export function getZoneCentroid(slug: string): [number, number] | null {
  const feature = ZONE_GEOJSON.features.find(
    (f) => (f.properties as { slug: string }).slug === slug
  )
  if (!feature || feature.geometry.type !== "Polygon") return null

  const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0]
  const len = coords.length - 1 // exclude closing point (same as first)
  if (len <= 0) return null

  let lngSum = 0
  let latSum = 0
  for (let i = 0; i < len; i++) {
    lngSum += coords[i][0]
    latSum += coords[i][1]
  }
  return [lngSum / len, latSum / len]
}

// Choropleth color scale based on price per m2
export function getPriceColor(pricePerM2: number): string {
  if (pricePerM2 >= 40000) return "#1e40af" // dark blue — premium
  if (pricePerM2 >= 32000) return "#3b82f6" // blue
  if (pricePerM2 >= 26000) return "#60a5fa" // light blue
  if (pricePerM2 >= 20000) return "#93c5fd" // pale blue
  return "#bfdbfe"                           // very pale
}

export function getPriceLabel(pricePerM2: number): string {
  if (pricePerM2 >= 40000) return "Premium"
  if (pricePerM2 >= 32000) return "Alto"
  if (pricePerM2 >= 26000) return "Medio-Alto"
  if (pricePerM2 >= 20000) return "Medio"
  return "Accesible"
}

// Mapbox uses [lng, lat] order
export const TIJUANA_CENTER: [number, number] = [-117.022, 32.515]
export const TIJUANA_BOUNDS: [[number, number], [number, number]] = [
  [-117.180, 32.360], // southwest
  [-116.800, 32.580], // northeast
]
