import * as passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

class JwtStrategy {
  constructor() {
    passport.use(
      new Strategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: process.env.JWT_SECRET,
        },
        (payload, done) => done(null, payload),
      ),
    );
  }

  authenticate(cb: (user: any) => void) {
    return passport.authenticate('jwt', { session: false }, (err, user) => {
      // Just add user to context (Validate only Authorized resolvers)
      cb(user);
    });
  }
}

export const jwtStrategy = new JwtStrategy();
