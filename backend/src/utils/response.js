function ok(res, data = null, message = 'OK') {
  return res.status(200).json({ success: true, message, data });
}

function created(res, data = null, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

function noContent(res) {
  return res.status(204).end();
}

export { ok, created, noContent };
