import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback,
} from "passport-google-oauth20";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";

import env from "./env";
import User from "../modules/identity/models/user.model";
import generateUserId from "../shared/utils/generateUserId";

// 1. Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: GoogleVerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();
        if (!email) {
          return done(new Error("No email returned from Google"), undefined);
        }

        // Strict boolean check for Google email verification status
        const isEmailVerified = profile.emails?.[0]?.verified === true;

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          if (user.accountStatus === "SUSPENDED") {
            return done(new Error("Account suspended"), undefined);
          }

          // SECURITY FIX: Only link by email if Google explicitly confirms verification
          const isMatchedByGoogleId = user.googleId === profile.id;
          if (!isMatchedByGoogleId && !isEmailVerified) {
            return done(
              new Error("Cannot link account: Google email is unverified."),
              undefined,
            );
          }

          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
            if (!user.isEmailVerified && isEmailVerified) {
              user.isEmailVerified = true;
              user.accountStatus = "ACTIVE";
            }
            await user.save();
          }
          return done(null, user);
        }

        // Generate custom userId matching local format
        let userId: string;
        do {
          userId = generateUserId();
        } while (await User.exists({ userId }));

        const nameParts = profile.displayName?.split(" ") || ["User", ""];
        user = await User.create({
          userId,
          firstName: profile.name?.givenName || nameParts[0] || "User",
          lastName:
            profile.name?.familyName || nameParts.slice(1).join(" ") || "User",
          email,
          provider: "GOOGLE",
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          isEmailVerified,
          accountStatus: isEmailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
          termsAcceptedAt: new Date(),
          privacyPolicyAcceptedAt: new Date(),
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    },
  ),
);

// 2. GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: (error: Error | null, user?: Express.User | false) => void,
    ) => {
      try {
        const primaryEmailObj = profile.emails?.[0];
        const rawEmail = primaryEmailObj?.value?.toLowerCase().trim();
        const isDummyEmail = !rawEmail;

        const email =
          rawEmail || `${profile.username}@github.noreply.com`.toLowerCase();

        // SECURITY FIX: Default to false unless GitHub explicitly confirms verified === true
        const isEmailVerified =
          !isDummyEmail && (primaryEmailObj as any)?.verified === true;

        let user = await User.findOne({
          $or: [{ githubId: profile.id }, { email }],
        });

        if (user) {
          if (user.accountStatus === "SUSPENDED") {
            return done(new Error("Account suspended"), undefined);
          }

          // SECURITY FIX: Reject linking if incoming GitHub email is unverified
          const isMatchedByGithubId = user.githubId === profile.id;
          if (!isMatchedByGithubId && !isEmailVerified) {
            return done(
              new Error("Cannot link account: GitHub email is unverified."),
              undefined,
            );
          }

          if (!user.githubId) {
            user.githubId = profile.id;
            if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
            if (!user.isEmailVerified && isEmailVerified) {
              user.isEmailVerified = true;
              user.accountStatus = "ACTIVE";
            }
            await user.save();
          }
          return done(null, user);
        }

        // Generate custom userId matching local format
        let userId: string;
        do {
          userId = generateUserId();
        } while (await User.exists({ userId }));

        const nameParts = (
          profile.displayName ||
          profile.username ||
          "User"
        ).split(" ");

        user = await User.create({
          userId,
          firstName: nameParts[0] || "User",
          lastName: nameParts.slice(1).join(" ") || "User",
          email,
          provider: "GITHUB",
          githubId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          isEmailVerified,
          accountStatus: isEmailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
          termsAcceptedAt: new Date(),
          privacyPolicyAcceptedAt: new Date(),
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    },
  ),
);

export default passport;
