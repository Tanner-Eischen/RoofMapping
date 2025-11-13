# Critical Development Notes

## For AI Development Agents

**1. Type Safety:**
- Use Zod schemas for API validation
- Share TypeScript interfaces between frontend/backend
- Never use `any` type

**2. Error Handling:**
- Always wrap async calls in try-catch
- Return structured error responses
- Log errors with context

**3. Performance:**
- Use React.memo for expensive components
- Lazy load camera and PDF components
- Cache API responses

**4. Testing:**
- Write tests before implementation
- Mock external APIs (Sentinel, USGS, Google Maps)
- Test error states

**5. Mobile-First:**
- Test on actual mobile devices
- Touch targets ≥44px
- Optimize images for mobile networks

## Known Limitations

1. **Satellite Resolution:** 10m may struggle with complex roofs
2. **LiDAR Coverage:** Not available everywhere in US
3. **Processing Time:** 2-5 minutes for satellite path
4. **ML Accuracy:** ~85-95% depending on conditions
5. **Mobile Camera:** Requires good lighting

## Future Enhancements

See `CompanyCam_Roof_Measurement_Future_Enhancements.md` for:
- Advanced AR measurement tools
- Real-time collaboration
- Material recommendations
- Cost estimation
- Offline mode

---
