import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';

import * as Api from '../src';

// Schemas

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

type Milan = S.To<typeof milanSchema>;

const lesnekSchema = S.struct({ name: S.string });

type Lesnek = S.To<typeof lesnekSchema>;

const standaSchema = S.record(S.string, S.union(S.string, S.number));

type Standa = S.To<typeof standaSchema>;

// Handlers

const handleMilan = ({ body }: Api.BodyInput<Milan>) =>
  Effect.succeed({
    ...body,
    penisLength: body.penisLength + 10,
  });

const handleStanda = ({ body }: Api.BodyInput<Standa>) =>
  Effect.succeed({ ...body, standa: 'je borec' });

const handleTest = ({ query: { name } }: Api.QueryInput<Lesnek>) =>
  Effect.succeed({ name });

const handleLesnek = ({ query }: Api.QueryInput<Lesnek>) =>
  pipe(
    Effect.succeed(`hello ${query.name}`),
    Effect.tap(() => Effect.logDebug('hello world'))
  );

// Api

const app = pipe(
  Api.make('My awesome pets API', '1.0.0'),
  Api.useGet('/milan', { response: S.string }, () => Effect.succeed('test')),
  Api.useGet(
    '/lesnek',
    { response: S.string, query: lesnekSchema },
    handleLesnek
  ),
  Api.useGet(
    '/test',
    { response: standaSchema, query: lesnekSchema },
    handleTest
  ),
  Api.usePost(
    '/standa',
    { response: standaSchema, body: standaSchema },
    handleStanda
  ),
  Api.usePost(
    '/milan',
    { response: milanSchema, body: milanSchema },
    handleMilan
  ),
  Api.listen(4000),
  Effect.flatMap(({ address, port }) =>
    Effect.logInfo(`Listening on ${address}:${port}`)
  )
);

Effect.runPromise(app);
