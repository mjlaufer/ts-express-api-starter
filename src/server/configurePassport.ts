import { PassportStatic } from 'passport';
import { Strategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { isEmail } from '../helpers/validation';
import UserRepository, { UserEntity } from '../model/repositories/user';
import { User } from '../model/services/user';

export default function configurePassport(passport: PassportStatic): void {
    passport.use(
        new Strategy(
            { usernameField: 'emailOrUsername' },
            async (emailOrUsername, password, done) => {
                try {
                    const userEntity: UserEntity | null = isEmail(emailOrUsername)
                        ? await UserRepository.findOne({ email: emailOrUsername })
                        : await UserRepository.findOne({ username: emailOrUsername });

                    if (!userEntity) {
                        return done(null, false);
                    }

                    return bcrypt.compare(password, userEntity.password, (err, res) => {
                        if (err) {
                            return done(err, false);
                        }

                        if (!res) {
                            return done(null, false);
                        }

                        return done(null, new User(userEntity));
                    });
                } catch (err) {
                    return done(err, false);
                }
            },
        ),
    );

    passport.serializeUser((user: User, done) => done(null, user.id));

    passport.deserializeUser(async (id: number, done) => {
        try {
            const userEntity: UserEntity = await UserRepository.findById(id);
            const user: User = new User(userEntity);
            return done(null, user);
        } catch {
            return done(null, false);
        }
    });
}