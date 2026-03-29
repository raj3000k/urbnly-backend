const express = require("express")
const router = express.Router()
const properties = require("../data/properties")

router.get("/", (req, res) => {
  const { search, budget, page = 1, limit = 5 } = req.query

  let result = properties

  // Search filter
  if (search) {
    const s = search.toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s)
    )
  }

  // Budget filter
  if (budget) {
    result = result.filter((p) => p.price <= Number(budget))
  }

  // Pagination
  const pageNum = Number(page)
  const limitNum = Number(limit)

  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  const paginated = result.slice(start, end)

  res.json({
    data: paginated,
    total: result.length,
    page: pageNum,
  })
})

router.get("/:id", (req, res) => {
  const property = properties.find((p) => p.id === req.params.id)

  if (!property) {
    return res.status(404).json({ message: "Not found" })
  }

  res.json(property)
})

module.exports = router