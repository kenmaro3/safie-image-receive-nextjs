import SEAL from "node-seal";

import { CipherText } from "node-seal/implementation/cipher-text";
import { CKKSEncoder } from "node-seal/implementation/ckks-encoder";
import { Context } from "node-seal/implementation/context";
import { Decryptor } from "node-seal/implementation/decryptor";
import { Encryptor } from "node-seal/implementation/encryptor";
import { Evaluator } from "node-seal/implementation/evaluator";
import { GaloisKeys } from "node-seal/implementation/galois-keys";
import { PlainText } from "node-seal/implementation/plain-text";
import { PublicKey } from "node-seal/implementation/public-key";
import { RelinKeys } from "node-seal/implementation/relin-keys";
import { SecretKey } from "node-seal/implementation/secret-key";

const EXAMPLE_VECTOR = Float64Array.from([1, 2, 3])
const EXAMPLE_REGRESSION_COEFFICIENTS = Float64Array.from([0.1, 0.2, 0.3, 0.4])

type PrivateParam = { 
    secretKey: SecretKey,
    decryptor: Decryptor
}

type PublicParam = {
    publicKey: PublicKey,
    galoisKey: GaloisKeys,
    relinerKey: RelinKeys,
    encryptor: Encryptor,
    evaluator: Evaluator,
    encoder:CKKSEncoder
};

type SerializedPublicParam = {
    publicKey: string,
    galoisKey: string,
    relinerKey: string,
};

type Param = {
    priv: PrivateParam,
    pub: PublicParam
}


const PROMISE_SEAL = SEAL()

const initContext = async (): Promise<Context>  =>  {
    const seal = await PROMISE_SEAL
    const securityLevel = seal.SecurityLevel.tc128
    const polyModulusDegree = 4096
    const bitSizes = Int32Array.from([36, 36, 37])

    const coeffModulus = seal.CoeffModulus.Create(polyModulusDegree, bitSizes)

    const params = seal.EncryptionParameters(seal.SchemeType.ckks)
    params.setPolyModulusDegree(polyModulusDegree)
    params.setCoeffModulus(coeffModulus)

    const context = seal.Context(params, true, securityLevel)
    return context
}

const initParams = async (): Promise<Param> => {
    const context = await initContext()
    const seal = await PROMISE_SEAL

    const keyGenerator = seal.KeyGenerator(context)
    const publicKey = keyGenerator.createPublicKey()
    const secretKey = keyGenerator.secretKey()
    const galoisKeys = keyGenerator.createGaloisKeys()
    const relinKeys = keyGenerator.createRelinKeys()

    const encryptor = seal.Encryptor(context, publicKey)
    const decryptor = seal.Decryptor(context, secretKey)
    const evaluator = seal.Evaluator(context)
    const encoder = seal.CKKSEncoder(context)

    const pub: PublicParam = {
        publicKey,
        galoisKey: galoisKeys,
        relinerKey: relinKeys,
        encryptor,
        evaluator,
        encoder
    }

    const priv: PrivateParam = {
        secretKey,
        decryptor,
    }

    const param: Param = {
        priv,
        pub
    }

    return param
}

const enc = (array: Float64Array, pub: PublicParam): CipherText => {
    const plainText = pub.encoder.encode(array, Math.pow(2, 20)) as PlainText
    const cipherText = pub.encryptor.encrypt(plainText) as CipherText
    return cipherText
}

const calcDistance = async (vector: Float64Array, cipherText: CipherText, pub: PublicParam): Promise<CipherText> => {
    // Run example:
    // https://github.com/morfix-io/node-seal/blob/main/FULL-EXAMPLE.md  
    const seal = await SEAL()

    // Encode the Array
    const plainText = pub.encoder.encode(vector, Math.pow(2, 20)) as PlainText

    // Encrypt the PlainText

    // Add the CipherText to itself and store it in the destination parameter (itself)
    // evaluator.add(cipherText, cipherText, cipherText) // Op (A), Op (B), Op (Dest)

    // Or create return a new cipher with the result (omitting destination parameter)
    const subCipher = pub.evaluator.subPlain(cipherText, plainText) as CipherText
    const powCipher = pub.evaluator.multiply(subCipher, subCipher) as CipherText
    const relinearizedCipher = pub.evaluator.relinearize(powCipher, pub.relinerKey) as CipherText
    const resultCipherText = pub.evaluator.sumElements(relinearizedCipher, pub.galoisKey, seal.SchemeType.ckks) as CipherText

    cipherText.delete()
    subCipher.delete()
    powCipher.delete()
    relinearizedCipher.delete()

    return resultCipherText
}

const calcLogisticRegression = async (vector: Float64Array, cipherText: CipherText, pub: PublicParam): Promise<CipherText> => {
    // Run example:
    // https://github.com/morfix-io/node-seal/blob/main/FULL-EXAMPLE.md  
    const seal = await SEAL()

    // Encode the Array
    const plainText = pub.encoder.encode(vector.slice(1), Math.pow(2, 20)) as PlainText

    // Encrypt the PlainText

    // Add the CipherText to itself and store it in the destination parameter (itself)
    // evaluator.add(cipherText, cipherText, cipherText) // Op (A), Op (B), Op (Dest)

    // Or create return a new cipher with the result (omitting destination parameter)
    const dotProduct = pub.evaluator.dotProductPlain(cipherText, plainText, pub.galoisKey, seal.SchemeType.ckks) as CipherText
    const firstCoefficient = pub.encoder.encode(Float64Array.from([vector[0]]), dotProduct.scale) as PlainText


    const resultCipherText = pub.evaluator.addPlain(dotProduct, firstCoefficient) as CipherText

    return resultCipherText
}

const dec = (cipherText: CipherText, priv: PrivateParam, pub: PublicParam): number => {
    // Decrypt the CipherText
    const decryptedPlainText = priv.decryptor.decrypt(cipherText) as PlainText

    // Decode the PlainText 
    const decodedArray = pub.encoder.decode(decryptedPlainText)

    return decodedArray[0]
}

const serializePub = (pub: PublicParam): string => {
    const publicKey = pub.publicKey.save()
    const galoisKey = pub.galoisKey.save()
    const relinerKey = pub.relinerKey.save()

    const serialized: SerializedPublicParam = {
        publicKey,
        galoisKey,
        relinerKey
    }

    return JSON.stringify(serialized)
}


const desiralizePub = async (pubkey: string): Promise<PublicParam> => {
    const pub = JSON.parse(pubkey)

    const context = await initContext()
    const seal = await PROMISE_SEAL

    const publicKey = seal.PublicKey()
    const galoisKey = seal.GaloisKeys()
    const relinerKey = seal.RelinKeys()

    publicKey.load(context, pub.publicKey)
    galoisKey.load(context, pub.galoisKey)
    relinerKey.load(context, pub.relinerKey)

    const encryptor = seal.Encryptor(context, publicKey)
    const evaluator = seal.Evaluator(context)
    const encoder = seal.CKKSEncoder(context)

    const deseliazed: PublicParam = {
        publicKey,
        galoisKey,
        relinerKey,
        encryptor,
        evaluator,
        encoder
    }

    return deseliazed
}


const calcExampleDistance = async (): Promise<Number> => {
    const input = Float64Array.from([1,2,3])

    const params = await initParams()
    const ser = serializePub(params.pub)
    const pub = await desiralizePub(ser)
    const cipherText = enc(input, pub)
    const resultCipherText = await calcDistance(EXAMPLE_VECTOR, cipherText, pub)
    const result = dec(resultCipherText, params.priv, pub)
    return result
}

const calcExampleLogisticRegression = async (): Promise<Number> => {
    const input = Float64Array.from([1, 2, 3])

    const params = await initParams()
    const ser = serializePub(params.pub)
    const pub = await desiralizePub(ser)
    const cipherText = enc(input, pub)
    const resultCipherText = await calcLogisticRegression(EXAMPLE_REGRESSION_COEFFICIENTS, cipherText, pub)
    const result = dec(resultCipherText, params.priv, pub)
    return result
}

export {
    initContext,
    initParams,
    enc,
    calcDistance,
    calcLogisticRegression,
    dec,
    serializePub,
    desiralizePub,
    PROMISE_SEAL,
    calcExampleDistance,
    calcExampleLogisticRegression,
    EXAMPLE_VECTOR,
    EXAMPLE_REGRESSION_COEFFICIENTS
};

export type {
    PrivateParam,
    PublicParam,
    SerializedPublicParam,
    Param
};
