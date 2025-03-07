from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import multiprocessing_logging

from app.api.v1.endpoints import small_routes, heavy_routes 
from app.api.v1.pdf_to_markdown import routes as pdf_to_markdown_routes

multiprocessing_logging.install_mp_handler()

app = FastAPI(debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from endpoints
app.include_router(small_routes.router)
app.include_router(heavy_routes.router)
app.include_router(pdf_to_markdown_routes.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8083) 