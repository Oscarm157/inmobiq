/**
 * GeoJSON polygons for Tijuana zones.
 * Clean hexagonal shapes centered on each zone for a modern dashboard aesthetic.
 * Coordinates in GeoJSON standard [lng, lat] order.
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
              -117.012246,
              32.53
            ],
            [
              -117.018123,
              32.538582
            ],
            [
              -117.029877,
              32.538582
            ],
            [
              -117.035754,
              32.53
            ],
            [
              -117.029877,
              32.521418
            ],
            [
              -117.018123,
              32.521418
            ],
            [
              -117.012246,
              32.53
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
              -117.106246,
              32.528
            ],
            [
              -117.112123,
              32.536582
            ],
            [
              -117.123877,
              32.536582
            ],
            [
              -117.129754,
              32.528
            ],
            [
              -117.123877,
              32.519418
            ],
            [
              -117.112123,
              32.519418
            ],
            [
              -117.106246,
              32.528
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
              -116.950245,
              32.535
            ],
            [
              -116.956123,
              32.543582
            ],
            [
              -116.967877,
              32.543582
            ],
            [
              -116.973755,
              32.535
            ],
            [
              -116.967877,
              32.526418
            ],
            [
              -116.956123,
              32.526418
            ],
            [
              -116.950245,
              32.535
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
              -116.980384,
              32.519
            ],
            [
              -116.985192,
              32.526022
            ],
            [
              -116.994808,
              32.526022
            ],
            [
              -116.999616,
              32.519
            ],
            [
              -116.994808,
              32.511978
            ],
            [
              -116.985192,
              32.511978
            ],
            [
              -116.980384,
              32.519
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
              -116.994318,
              32.5
            ],
            [
              -116.999659,
              32.507802
            ],
            [
              -117.010341,
              32.507802
            ],
            [
              -117.015682,
              32.5
            ],
            [
              -117.010341,
              32.492198
            ],
            [
              -116.999659,
              32.492198
            ],
            [
              -116.994318,
              32.5
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
              -117.030382,
              32.536
            ],
            [
              -117.035191,
              32.543022
            ],
            [
              -117.044809,
              32.543022
            ],
            [
              -117.049618,
              32.536
            ],
            [
              -117.044809,
              32.528978
            ],
            [
              -117.035191,
              32.528978
            ],
            [
              -117.030382,
              32.536
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
              -116.994319,
              32.493
            ],
            [
              -116.999659,
              32.500802
            ],
            [
              -117.010341,
              32.500802
            ],
            [
              -117.015681,
              32.493
            ],
            [
              -117.010341,
              32.485198
            ],
            [
              -116.999659,
              32.485198
            ],
            [
              -116.994319,
              32.493
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
              -116.952316,
              32.522
            ],
            [
              -116.957658,
              32.529802
            ],
            [
              -116.968342,
              32.529802
            ],
            [
              -116.973684,
              32.522
            ],
            [
              -116.968342,
              32.514198
            ],
            [
              -116.957658,
              32.514198
            ],
            [
              -116.952316,
              32.522
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
              -117.04519,
              32.44
            ],
            [
              -117.051595,
              32.449362
            ],
            [
              -117.064405,
              32.449362
            ],
            [
              -117.07081,
              32.44
            ],
            [
              -117.064405,
              32.430638
            ],
            [
              -117.051595,
              32.430638
            ],
            [
              -117.04519,
              32.44
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
              -117.079324,
              32.448
            ],
            [
              -117.084662,
              32.455802
            ],
            [
              -117.095338,
              32.455802
            ],
            [
              -117.100676,
              32.448
            ],
            [
              -117.095338,
              32.440198
            ],
            [
              -117.084662,
              32.440198
            ],
            [
              -117.079324,
              32.448
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
              -116.858989,
              32.435
            ],
            [
              -116.866994,
              32.446703
            ],
            [
              -116.883006,
              32.446703
            ],
            [
              -116.891011,
              32.435
            ],
            [
              -116.883006,
              32.423297
            ],
            [
              -116.866994,
              32.423297
            ],
            [
              -116.858989,
              32.435
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
              -116.882191,
              32.438
            ],
            [
              -116.888595,
              32.447362
            ],
            [
              -116.901405,
              32.447362
            ],
            [
              -116.907809,
              32.438
            ],
            [
              -116.901405,
              32.428638
            ],
            [
              -116.888595,
              32.428638
            ],
            [
              -116.882191,
              32.438
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
  const len = coords.length - 1 // exclude closing point
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
