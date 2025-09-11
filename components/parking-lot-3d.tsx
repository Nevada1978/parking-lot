'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ParkingSpot } from '@prisma/client'

interface ParkingLot3DProps {
  spots: ParkingSpot[]
  onSpotClick?: (spot: ParkingSpot) => void
}

export function ParkingLot3D({ spots, onSpotClick }: ParkingLot3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.OrthographicCamera>()
  const spotsRef = useRef<Map<string, { mesh: THREE.Group; light: THREE.PointLight }>>(new Map())

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mountRef.current) return

    // 初始化Three.js场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)
    sceneRef.current = scene

    // 设置正交相机（俯视角度）
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight
    const camera = new THREE.OrthographicCamera(
      -width / 50, width / 50, height / 50, -height / 50, 1, 1000
    )
    camera.position.set(0, 50, 0)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    
    mountRef.current.appendChild(renderer.domElement)

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    // 顶部光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 20, 0)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // 创建停车场地面
    const groundGeometry = new THREE.PlaneGeometry(20, 15)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // 渲染循环
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [isClient])

  // 创建车位和车辆
  useEffect(() => {
    if (!sceneRef.current) return

    // 清除现有车位
    spotsRef.current.forEach(({ mesh, light }) => {
      sceneRef.current?.remove(mesh)
      sceneRef.current?.remove(light)
    })
    spotsRef.current.clear()

    spots.forEach((spot) => {
      const group = new THREE.Group()
      
      // 计算位置（6行8列布局）
      const colIndex = spot.col - 1 // 0-7
      const rowIndex = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(spot.row) // 0-5
      
      const x = (colIndex - 3.5) * 2.2 // 居中，间距2.2
      const z = (rowIndex - 2.5) * 2.2 // 居中，间距2.2
      
      // 创建停车位底座
      const spotGeometry = new THREE.BoxGeometry(2, 0.1, 2)
      const spotMaterial = new THREE.MeshLambertMaterial({ 
        color: spot.isOccupied ? 0x444444 : 0x666666 
      })
      const spotMesh = new THREE.Mesh(spotGeometry, spotMaterial)
      spotMesh.position.set(x, 0.05, z)
      spotMesh.receiveShadow = true
      group.add(spotMesh)

      // 创建车辆模型（如果被占用）
      if (spot.isOccupied) {
        const carGeometry = new THREE.BoxGeometry(1.8, 0.8, 1.2)
        const carMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5) 
        })
        const carMesh = new THREE.Mesh(carGeometry, carMaterial)
        carMesh.position.set(x, 0.5, z)
        carMesh.castShadow = true
        group.add(carMesh)

        // 车辆轮子
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8)
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 })
        
        const positions = [
          [x - 0.7, 0.2, z - 0.4],
          [x + 0.7, 0.2, z - 0.4],
          [x - 0.7, 0.2, z + 0.4],
          [x + 0.7, 0.2, z + 0.4],
        ]
        
        positions.forEach(([wx, wy, wz]) => {
          const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
          wheel.position.set(wx, wy, wz)
          wheel.rotation.z = Math.PI / 2
          group.add(wheel)
        })
      }

      // 创建状态指示灯
      const lightGeometry = new THREE.SphereGeometry(0.15, 8, 8)
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: spot.isOccupied ? 0xff4444 : 0x4444ff,
        emissive: spot.isOccupied ? 0x441111 : 0x111144
      })
      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial)
      lightMesh.position.set(x, 1.5, z + 0.8)
      group.add(lightMesh)

      // 点光源
      const pointLight = new THREE.PointLight(
        spot.isOccupied ? 0xff4444 : 0x4444ff, 
        1, 
        3
      )
      pointLight.position.set(x, 1.5, z + 0.8)

      // 添加车位编号标签
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = 128
      canvas.height = 64
      context.fillStyle = 'white'
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.fillText(spot.spotId, 64, 40)
      
      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: texture })
      const label = new THREE.Sprite(labelMaterial)
      label.position.set(x, 2, z - 1.2)
      label.scale.set(1, 0.5, 1)
      group.add(label)

      // 添加到场景
      sceneRef.current?.add(group)
      sceneRef.current?.add(pointLight)
      
      spotsRef.current.set(spot.spotId, { mesh: group, light: pointLight })

      // 添加点击事件
      if (onSpotClick) {
        group.userData = { spot, spotId: spot.spotId }
        group.traverse((child) => {
          child.userData = { spot, spotId: spot.spotId }
        })
      }
    })
  }, [spots, onSpotClick])

  // 处理鼠标点击
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !onSpotClick) return

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current) return
      
      const rect = mountRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, cameraRef.current!)
      const intersects = raycaster.intersectObjects(sceneRef.current!.children, true)

      if (intersects.length > 0) {
        const userData = intersects[0].object.userData
        if (userData?.spot) {
          onSpotClick(userData.spot)
        }
      }
    }

    const canvas = rendererRef.current.domElement
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('click', handleClick)
    }
  }, [onSpotClick])

  if (!isClient) {
    return <div className="w-full h-[600px] bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-white">Loading 3D View...</div>
    </div>
  }

  return <div ref={mountRef} className="w-full h-[600px] rounded-lg overflow-hidden" />
}