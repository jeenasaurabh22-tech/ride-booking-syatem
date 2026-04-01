const User = require("../models/User");
const Ride = require("../models/Ride");
const { onlineDrivers, userSocketMap } = require("../services/state");
const { haversineDistanceKm } = require("../utils/geo");
const { cityMap } = require("../data/cities");

const setOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    await User.findByIdAndUpdate(req.user._id, { isOnline: Boolean(isOnline) });

    if (!isOnline) {
      onlineDrivers.delete(String(req.user._id));
    }

    return res.json({ message: `Driver is now ${isOnline ? "online" : "offline"}` });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change online status", error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, city } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng must be numbers" });
    }

    const finalCity = city || req.user.city;
    const driverId = String(req.user._id);

    onlineDrivers.set(driverId, {
      driverId,
      name: req.user.name,
      city: finalCity,
      lat,
      lng,
      updatedAt: Date.now(),
    });

    await User.findByIdAndUpdate(req.user._id, {
      isOnline: true,
      location: {
        lat,
        lng,
        city: finalCity,
        updatedAt: new Date(),
      },
    });

    const activeRide = await Ride.findOne({
      driverId: req.user._id,
      status: { $in: ["assigned", "ongoing"] },
    }).sort({ createdAt: -1 });

    if (activeRide) {
      const pickup = cityMap[activeRide.pickupCity];
      if (pickup) {
        const distance = haversineDistanceKm({ lat, lng }, { lat: pickup.lat, lng: pickup.lng });
        activeRide.distanceFromDriverToPickupKm = Number(distance.toFixed(2));
        await activeRide.save();

        const userSocketId = userSocketMap.get(String(activeRide.userId));
        if (userSocketId) {
          req.io.to(userSocketId).emit("ride:driver-distance", {
            rideId: activeRide._id,
            driverId: req.user._id,
            distanceFromDriverToPickupKm: activeRide.distanceFromDriverToPickupKm,
            driverLocation: { lat, lng, city: finalCity },
          });
        }
      }
    }

    return res.json({ message: "Location updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update location", error: error.message });
  }
};

module.exports = { setOnlineStatus, updateLocation };
