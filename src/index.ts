import {Hono} from 'hono'
import {env} from 'hono/adapter'
import {MongoClient} from "mongodb"
import z from 'zod'
import {describeRoute, openAPISpecs} from "hono-openapi";
import { zodToJsonSchema } from "zod-to-json-schema";
import {Scalar} from"@scalar/hono-api-reference";

const app = new Hono()

const movieSchema = z.object({
  plot: z.string().optional(),
  genres: z.array(z.string()).optional(),
  runtime: z.number().optional(),
  cast: z.array(z.string()).optional(),
  poster: z.string().optional(),
  title: z.string(),
  year: z.number(),
  languages: z.array(z.string()).optional(),
  directors: z.array(z.string()).optional(),
  released: z.string().optional(),
  countries: z.array(z.string()).optional(),
  fullplot: z.string().optional(),
  rated: z.string().optional(),
})

app.get('/', (c) => {
  return c.html(
    '<div style="text-align: center; font-family: Verdana, Geneva, Tahoma, sans-serif;"><h1 >Welcome to TroneFilms</h1><p>An API created to Get, Post and Delete Movies from a database</p><p><a href="/api">MOVIES API</a></p></div>')
})

app.get('/api/movies/:title', 
  describeRoute({
    description: 'Get a movie',
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              message: z.string(),
            })),
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
    },
  }),

  async (c) => {
    // Buscar Movie en base de datos mongoDB
    const {title} = c.req.param()
    const {DB_CONN_STRING} = env<{ DB_CONN_STRING: string }>(c)
    const client = new MongoClient(DB_CONN_STRING)

    const database = client.db('sample_mflix')
    const movies = database.collection('movies')
    const result = await movies.findOne({title: title})
  return c.json({result})
})

app.delete('/api/movies/:title', 
  describeRoute({
    description: 'Delete a movie',
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              message: z.string(),
            })),
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
    },

  }),

  async(c) => {
  const {title} = c.req.param()
  const {DB_CONN_STRING} = env<{ DB_CONN_STRING: string }>(c)
  const client = new MongoClient(DB_CONN_STRING)
  const database = client.db('sample_mflix')
  const movies = database.collection('movies')
  const result = await movies.deleteOne({title: title})
  if (result.deletedCount === 0) {
    return c.text(`Movie ${title} not found`, 404)
  }else{
    return c.text(`Movie ${title} deleted`)
  }
  // Borrar Movie en base de datos mongoDB
})


app.post('/api/movies',
  describeRoute({
    description: 'Post a movie',
   requestBody: {
     content: {
       'application/json': {
         schema: zodToJsonSchema(movieSchema),
       },
     },
   },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: zodToJsonSchema(movieSchema),
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              error: z.string(),
            })),
          },
        },
      },
    },
  }),
  async (c) => {
    // Insertar Movie en base de datos mongoDB
    const body = await c.req.json()
    const {title, year} = movieSchema.parse(body)
    const {DB_CONN_STRING} = env<{ DB_CONN_STRING: string }>(c)
    const client = new MongoClient(DB_CONN_STRING)

    const database = client.db('sample_mflix')
    const movies = database.collection('movies')
    const result = await movies.insertOne({
      title: title,
      year: year,
      plot: body.plot,
      genres: body.genres,
      runtime: body.runtime,
      cast: body.cast,
      poster: body.poster,
      languages: body.languages,
      directors: body.directors,
      released: body.released,
      countries: body.countries,
      fullplot: body.fullplot,
      rated: body.rated
    })
    if (!result.acknowledged) {
      return c.text('Error inserting movie', 500)
    }else{
      return c.text('Movie inserted with id: ' + result.insertedId)
    }
  })

app.get(
  '/api/openapi',
    openAPISpecs(app, {
        documentation: {
            info: {
                title: 'TroneFilms API',
                version: '1.0.0',
                description: 'An API to get, post and delete movies from a movies database!',
            },
            servers: [
              { url: 'https://tronefilms.oreneta.workers.dev/', description: 'Live Server' },
              { url: 'http://127.0.0.1:8787/', description: 'Test Server' }
            ],
        },
    })
)

app.get(
  "/api",
  Scalar({
    url: "/api/openapi",
    pageTitle: "Movies API",
  })
)

export default app