"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";



export async function storeUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    console.log("Auth userId:", userId); // ✅ Check if userId is retrieved
    console.log("Current user:", user); // ✅ Check if user details are fetched

    if (!userId || !user) {
      console.log("❌ User not found, skipping insertion.");
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      console.log("✅ User already exists in DB:", existingUser);
      return existingUser;
    }

    console.log("🆕 Creating a new user in DB...");
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    console.log("✅ User stored successfully:", dbUser);
    return dbUser;
  } catch (error) {
    console.error("❌ Error in storeUser", error);
  }
}



export async function getUserByclientId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true // ❌ Removed the unnecessary comma here
        }
      }
    }
  });
}
