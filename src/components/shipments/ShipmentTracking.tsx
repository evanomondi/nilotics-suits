"use client";

interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
}

interface Shipment {
  id: string;
  courier: string;
  waybill: string;
  status: string;
  labelUrl?: string;
  cost?: number;
  trackingHistory?: TrackingEvent[];
  createdAt: string;
}

interface ShipmentTrackingProps {
  shipment: Shipment;
}

export function ShipmentTracking({ shipment }: ShipmentTrackingProps) {
  const statusDisplay: Record<string, { label: string; color: string }> = {
    label_created: { label: "Label Created", color: "bg-gray-100 text-gray-700" },
    picked_up: { label: "Picked Up", color: "bg-blue-100 text-blue-700" },
    in_transit: { label: "In Transit", color: "bg-blue-100 text-blue-700" },
    out_for_delivery: { label: "Out for Delivery", color: "bg-yellow-100 text-yellow-700" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
    delivery_failed: { label: "Delivery Failed", color: "bg-red-100 text-red-700" },
    returned: { label: "Returned", color: "bg-orange-100 text-orange-700" },
    on_hold: { label: "On Hold", color: "bg-gray-100 text-gray-700" },
  };

  const currentStatus = statusDisplay[shipment.status] || {
    label: shipment.status,
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">Shipment Details</h3>
            <p className="text-sm text-gray-500">
              {shipment.courier} - {shipment.waybill}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {shipment.cost && (
            <div>
              <span className="text-gray-500">Shipping Cost:</span>
              <span className="ml-2 font-medium">${shipment.cost.toFixed(2)}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium">
              {new Date(shipment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {shipment.labelUrl && (
          <div className="mt-4">
            <a
              href={shipment.labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Download Shipping Label →
            </a>
          </div>
        )}
      </div>

      {shipment.trackingHistory && shipment.trackingHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-4">Tracking History</h4>
          <div className="space-y-3">
            {shipment.trackingHistory.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{event.status}</p>
                      {event.location && (
                        <p className="text-sm text-gray-500">{event.location}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
