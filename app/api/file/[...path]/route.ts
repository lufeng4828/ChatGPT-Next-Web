import { getServerSideConfig } from "@/app/config/server";
import LocalFileStorage from "@/app/utils/local_file_storage";
import { NextRequest, NextResponse } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  try {
    const serverConfig = getServerSideConfig();
    if (serverConfig.isStoreFileToLocal) {
      var fileBuffer = await LocalFileStorage.get(params.path[0]);
      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "image/png",
        },
      });
    } else {
      return new Response("local storage not found", {
        status: 404,
      });
    }
  } catch (e) {
    return new Response("not found", {
      status: 404,
    });
  }
}

export const GET = handle;

export const runtime = "nodejs";
export const revalidate = 0;
