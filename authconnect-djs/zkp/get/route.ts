import {NextRequest, NextResponse} from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {

    const zkpPayload = await request.json();
    console.log("received payload with Request for ZKP = ", zkpPayload);
    return axios.post('https://prover-dev.mystenlabs.com', zkpPayload,
    ).then((response) => {
        const data = response.data;
        console.log("response.data: ", data);
        return NextResponse.json({code: 200, zkp: data});
    }).catch((error) => {
        return NextResponse.json({code: 500, message: "Error! inner = ", error});
    });
}
