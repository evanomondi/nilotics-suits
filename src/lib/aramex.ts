// Aramex Kenya API Client
// Documentation: https://www.aramex.com/ae/en/developers-solution-center/aramex-apis

interface ShipmentDetails {
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  recipientPhone: string;
  weight: number; // kg
  description: string;
}

export async function createAramexShipment(details: ShipmentDetails) {
  const url = `${process.env.ARAMEX_BASE_URL}/shipments/create`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": process.env.ARAMEX_KEY || "",
      },
      body: JSON.stringify({
        ClientInfo: {
          AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
          UserName: process.env.ARAMEX_KEY,
          Password: process.env.ARAMEX_SECRET,
        },
        Shipments: [{
          Shipper: {
            Name: "Nilotic Suits",
            Address: "Nairobi, Kenya",
            Phone: "+254700000000",
          },
          Consignee: {
            Name: details.recipientName,
            Address: details.recipientAddress,
            City: details.recipientCity,
            CountryCode: details.recipientCountry,
            Phone: details.recipientPhone,
          },
          Details: {
            Weight: details.weight,
            NumberOfPieces: 1,
            Description: details.description,
          },
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Aramex API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      waybill: data.Shipments[0].ID,
      labelUrl: data.Shipments[0].ShipmentLabel?.LabelURL,
      cost: data.Shipments[0].TotalAmount,
    };
  } catch (error) {
    console.error("Aramex shipment creation error:", error);
    throw error;
  }
}
