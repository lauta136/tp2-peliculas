// Carga datos de prueba: un admin, un user comun y algunas peliculas de cada uno.
// Idempotente: si los usuarios ya existen no los duplica, y solo carga peliculas si no hay ninguna.
//
//   npm run seed      (lee MONGODB_URI y SEED_* del .env)
//
// Para produccion: correrlo en local con MONGODB_URI apuntando a Atlas, o desde el Shell de Render.
import "dotenv/config";
import mongoose from "mongoose";
import { auth } from "../src/lib/auth.js";
import { requireEnv } from "../src/lib/env.js";
import Movie, { IMovie } from "../src/models/Movie.js";

type SeedUser = { name: string; email: string; password: string; role: "admin" | "user" };

const users: SeedUser[] = [
  { name: "Administrador", email: requireEnv("SEED_ADMIN_EMAIL"), password: requireEnv("SEED_ADMIN_PASSWORD"), role: "admin" },
  { name: "Usuario de prueba", email: requireEnv("SEED_USER_EMAIL"), password: requireEnv("SEED_USER_PASSWORD"), role: "user" },
];

type SeedMovie = Omit<IMovie, "ownerId" | "ownerName" | "releaseDate"> & { releaseDate: string };

const adminMovies: SeedMovie[] = [
  { title: "El secreto de sus ojos", director: "Juan José Campanella", genre: "Suspenso", releaseDate: "2009-08-13", durationMinutes: 129, rating: 9, watched: true, synopsis: "Un empleado judicial retirado escribe una novela sobre un caso de asesinato sin resolver que lo marcó 25 años atrás." },
  { title: "Relatos salvajes", director: "Damián Szifron", genre: "Comedia", releaseDate: "2014-08-21", durationMinutes: 122, rating: 8.5, watched: true, synopsis: "Seis historias independientes sobre personas que pierden el control frente a la injusticia y la violencia cotidiana." },
  { title: "Interestelar", director: "Christopher Nolan", genre: "Ciencia ficcion", releaseDate: "2014-11-06", durationMinutes: 169, rating: 9, watched: true, synopsis: "Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad." },
  { title: "El viaje de Chihiro", director: "Hayao Miyazaki", genre: "Animacion", releaseDate: "2001-07-20", durationMinutes: 125, rating: 9.5, watched: true, synopsis: "Una niña queda atrapada en un mundo de espíritus y debe trabajar en una casa de baños para liberar a sus padres." },
  { title: "Parásitos", director: "Bong Joon-ho", genre: "Drama", releaseDate: "2019-05-30", durationMinutes: 132, rating: 9, watched: true, synopsis: "Una familia pobre se infiltra, uno por uno, en la vida de una familia adinerada." },
  { title: "Mad Max: Furia en el camino", director: "George Miller", genre: "Accion", releaseDate: "2015-05-14", durationMinutes: 120, rating: 8.5, watched: false, synopsis: "En un desierto postapocalíptico, una guerrera huye de un tirano junto a un grupo de prisioneras y un vagabundo." },
  { title: "El laberinto del fauno", director: "Guillermo del Toro", genre: "Fantasia", releaseDate: "2006-10-11", durationMinutes: 118, rating: 8.5, watched: false, synopsis: "En la España de posguerra, una niña descubre un mundo fantástico mientras su padrastro persigue a la resistencia." },
  { title: "Hereditary", director: "Ari Aster", genre: "Terror", releaseDate: "2018-06-08", durationMinutes: 127, rating: 7.5, watched: false, synopsis: "Tras la muerte de la abuela, una familia empieza a descubrir secretos oscuros sobre su linaje." },
];

const userMovies: SeedMovie[] = [
  { title: "Nueve reinas", director: "Fabián Bielinsky", genre: "Suspenso", releaseDate: "2000-08-31", durationMinutes: 114, rating: 8.5, watched: true, synopsis: "Dos estafadores se cruzan por casualidad y planean vender una planilla de estampillas falsas a un coleccionista." },
  { title: "La La Land", director: "Damien Chazelle", genre: "Romance", releaseDate: "2016-12-09", durationMinutes: 128, rating: 8, watched: true, synopsis: "Una aspirante a actriz y un pianista de jazz se enamoran mientras persiguen sus sueños en Los Ángeles." },
  { title: "Dune: Parte dos", director: "Denis Villeneuve", genre: "Ciencia ficcion", releaseDate: "2024-02-29", durationMinutes: 166, rating: 8.5, watched: false, synopsis: "Paul Atreides se une a los Fremen para vengarse de quienes destruyeron a su familia." },
  { title: "Bowling for Columbine", director: "Michael Moore", genre: "Documental", releaseDate: "2002-10-11", durationMinutes: 120, rating: 7.5, watched: false, synopsis: "Un documental sobre la cultura de las armas en Estados Unidos a partir de la masacre de Columbine." },
];

async function ensureUser({ name, email, password, role }: SeedUser): Promise<{ id: string; name: string }> {
  const users = mongoose.connection.collection("user");
  let doc = await users.findOne({ email });

  if (!doc) {
    // signUpEmail hashea la contraseña igual que el registro desde el front.
    await auth.api.signUpEmail({ body: { name, email, password } });
    doc = await users.findOne({ email });
    console.log(`[seed] usuario creado: ${email}`);
  } else {
    console.log(`[seed] el usuario ya existia: ${email}`);
  }

  if (!doc) throw new Error(`No se pudo crear ${email}`);
  // Todo registro nuevo es "user": el rol admin se asigna directo en la base.
  await users.updateOne({ _id: doc._id }, { $set: { role } });
  return { id: doc._id.toString(), name: doc.name as string };
}

async function main(): Promise<void> {
  await mongoose.connect(requireEnv("MONGODB_URI"));

  const [admin, user] = await Promise.all(users.map(ensureUser));

  if ((await Movie.countDocuments()) > 0) {
    console.log("[seed] ya hay peliculas cargadas: no se agregan");
  } else {
    const withOwner = (owner: { id: string; name: string }) => (m: SeedMovie) => ({
      ...m,
      releaseDate: new Date(m.releaseDate),
      ownerId: owner.id,
      ownerName: owner.name,
    });
    await Movie.insertMany([...adminMovies.map(withOwner(admin)), ...userMovies.map(withOwner(user))]);
    console.log(`[seed] ${adminMovies.length + userMovies.length} peliculas creadas`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("[seed] fallo:", error);
  process.exit(1);
});
