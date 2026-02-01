const router = require("express").Router()
const Product = require("../models/Product");
const Order = require("../models/Order");

router.get('/', async (req, res) => {
    try {
        let recommendedProducts = [];

        if (req.session.user && req.session.user.role !== "admin") {
            const orders = await Order.find({ customer: req.session.user._id })
                .select("items.product")
                .populate("items.product");

            const recommendedMap = new Map();
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.product) {
                        const id = item.product._id.toString();
                        recommendedMap.set(id, (recommendedMap.get(id) || 0) + item.quantity);
                    }
                });
            });

            const recommendedIds = [...recommendedMap.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([id]) => id);

            if (recommendedIds.length > 0) {
                recommendedProducts = await Product.find({ _id: { $in: recommendedIds } });
            } else {
                recommendedProducts = await Product.find().sort({ createdAt: -1 }).limit(4);
            }
        }

        res.render('homepage.ejs', { recommendedProducts });
    } catch (error) {
        console.log(error);
        res.render('homepage.ejs', { recommendedProducts: [] });
    }
})
module.exports = router;
