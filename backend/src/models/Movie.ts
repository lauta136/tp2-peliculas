import { Schema, model, Document, Model, Types } from "mongoose";

export const GENRES = [
  "Accion",
  "Animacion",
  "Ciencia ficcion",
  "Comedia",
  "Documental",
  "Drama",
  "Fantasia",
  "Romance",
  "Suspenso",
  "Terror",
  "Otro",
] as const;

export type Genre = (typeof GENRES)[number];

// Tipos usados: texto (title, director, synopsis, genre), numero (durationMinutes, rating),
// fecha (releaseDate) y booleano (watched).
export interface IMovie {
  title: string;
  director: string;
  genre: Genre;
  releaseDate: Date;
  durationMinutes: number;
  rating: number;
  watched: boolean;
  synopsis: string;
  posterUrl?: string;
  // Dueño del registro: el id de Better Auth (string) y su nombre al momento de crearlo.
  ownerId: string;
  ownerName: string;
}

export interface IMovieDocument extends IMovie, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovieDocument>(
  {
    title: {
      type: String,
      required: [true, "El titulo es obligatorio"],
      trim: true,
      maxlength: [150, "El titulo no puede superar 150 caracteres"],
    },
    director: {
      type: String,
      required: [true, "El director es obligatorio"],
      trim: true,
      maxlength: [100, "El director no puede superar 100 caracteres"],
    },
    genre: {
      type: String,
      required: [true, "El genero es obligatorio"],
      enum: GENRES,
    },
    releaseDate: {
      type: Date,
      required: [true, "La fecha de estreno es obligatoria"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "La duracion es obligatoria"],
      min: [1, "La duracion minima es 1 minuto"],
      max: [600, "La duracion maxima es 600 minutos"],
    },
    rating: {
      type: Number,
      required: [true, "El puntaje es obligatorio"],
      min: [0, "El puntaje va de 0 a 10"],
      max: [10, "El puntaje va de 0 a 10"],
    },
    watched: {
      type: Boolean,
      default: false,
    },
    synopsis: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "La sinopsis no puede superar 1000 caracteres"],
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Movie: Model<IMovieDocument> = model<IMovieDocument>("Movie", movieSchema);

export default Movie;
